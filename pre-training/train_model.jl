# USAGE (for single country data file): julia train_model.jl codes.json "840.csv"
# USAGE (for multiple country files): julia train_model.jl codes.json "country_files/"

using CSV, StatsBase, Distributions, Statistics, JSON, DataFrames, CorrectMatch, Glob

println("Loaded libraries")

# code file is a JSON file that provides mapping from (coded) integer values in csv
# to (human-readable) string values (see codes.json for sample)
codefile = ARGS[1]
codes = JSON.parsefile(codefile)

# folder with country level data to process
folder_path = ARGS[2]
files = glob(folder_path)

# country population & ISO data to extrapolate correctness scores
# and output usable model with demo
countries = CSV.read("countries.csv", DataFrame)

error_files = []
for path in files
	global error_files
	# get IPUMS code of country from file name
	code = parse(Int, splitext(basename(path))[1])

	countryName = ""
	iso = ""
	continent = ""
	pop_num = 0
	for row in eachrow(countries)
		if row[2] === code			
			# if IPUMS code of filename matches country row
			# set country name, continent and population number
			iso = row[1]
			countryName = row[3]
			continent = row[4]
			pop_num = row[5]
		end
	end

	if iso == ""
		# country not found, cannot process data
		push!(error_files, path)
		println("Error (Missing country): $path")
		continue
	end

	println("Reading $countryName - $path ($iso.json)")

	# load data from CSV
	df = CSV.read(path, DataFrame)
	nrows, ncols = size(df) 
	firstrow = Array(df[1, 1:ncols])

	# remove unwanted columns by name from IPUMS data
	ends_with_d(str::String) = 
		match(r".*D$", str) === nothing

	equals_manual_deselect(str::String, deselect::Array{String}) = 
		!(str in deselect)

	missing_mask = (firstrow .!== missing)
	ends_with_d_mask = broadcast(ends_with_d, names(df))
	deselect = [  "COUNTRY", "PERNUM", "PERWT", "CHBORN" ]
	if("GEOLEV2" in names(df)[missing_mask])
		push!(deselect, "GEOLEV1")
	end
	manual_deselect(name) = equals_manual_deselect(name, deselect)
	manual_deselect_mask = broadcast(manual_deselect, names(df))
	total_mask = missing_mask .& ends_with_d_mask .& manual_deselect_mask
	df = df[total_mask]

	# remove rows with special codes (unknown/missing)
	if "AGE" in names(df)
		df = df[df[:, "AGE"] .!= 999, :]
	end

	if "SEX" in names(df)
		df = df[df[:, "SEX"] .!= 9, :]
	end

	if "MARST" in names(df)
		df = df[df[:, "MARST"] .!= 0, :]
		df = df[df[:, "MARST"] .!= 9, :]
	end

	if "CHBORN" in names(df)
		df = df[df[:, "CHBORN"] .!= 98, :]
	end

	if "RELIGION" in names(df)
		df = df[df[:, "RELIGION"] .!= 0, :]
		df = df[df[:, "RELIGION"] .!= 9, :]
	end

	if "RACE" in names(df)
		df = df[df[:, "RACE"] .!= 99, :]
	end

	if "EDATTAIN" in names(df)
		df = df[df[:, "EDATTAIN"] .!= 0, :]
		df = df[df[:, "EDATTAIN"] .!= 9, :]
	end

	if "EMPSTAT" in names(df)
		df = df[df[:, "EMPSTAT"] .!= 0, :]
		df = df[df[:, "EMPSTAT"] .!= 3, :]
		df = df[df[:, "EMPSTAT"] .!= 9, :]
	end

	num_rows = size(df, 1)
	num_cols = size(df, 2)
	println("Filtered data. Number of rows: $num_rows, Number of cols: $num_cols")

	data = Array{Int}(df)
	N, M = size(data)

	# extract marginals from frequencies
	function extract_marginal_ordered(row::AbstractVector)
		cm = countmap(row; alg=:dict)
		uniqVals = collect(keys(cm))
		counts = collect(values(cm))
		Categorical(counts / sum(counts)), uniqVals
	end

	marginalsTuples = [extract_marginal_ordered(data[:, i]) for i=1:M]
	marginals = [marginal for (marginal, uniqVals) in marginalsTuples]
	marginalVals = [uniqVals for (marginal, uniqVals) in marginalsTuples]

	# fit data to model using fit_mle function from CorrectMatch library
	G = fit_mle(GaussianCopula, marginals, data)
	println("Trained model!")

	# replace integer codes in model result with string values using codefile
	marginal_results = Dict()
	error = false
	for i in 1:length(names(df))
		probs = G.marginals[i].p
		header = names(df)[i]
		uniqVals = marginalVals[i]

		if header in keys(codes)
			updatedVals = []
			for val in uniqVals
				str_val = string(val)
				if str_val in keys(codes[header])
					push!(updatedVals, codes[header][str_val])
				else
					println("Missing key($str_val) in header($header)")
					error = true
				end
			end
			uniqVals = updatedVals
		end

		marginal_results[header] = Dict("uniqVals" => uniqVals, "probs" => probs)
	end

	if error
		push!(error_files, path)
		println("Error (Missing Key): $path")
		continue
	end

	# package model in a usable object for the demo
	result = Dict("avail_var" => names(df), "pop_num" => pop_num, "corr" => Matrix(G.Σ), "marginals" => marginal_results)

	# output model
	open("processed_models/$iso.json", "w") do f
		JSON.print(f, result, 4)
	end

	println("Written output model to $iso.json")
end

println("\nError Files")
for error_file in error_files
	println(error_file)
end
