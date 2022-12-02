import { Categorical, GaussianCopula } from './distributions';
import {
    extract_marginal,
    mutual_information,
    mutual_information_matrix,
} from './copula_utils';
import { choose_random } from './utils';
import * as math from 'mathjs';

// extract Categorical marginals from data
function extract_marginals(dataT: number[][]): Categorical[] {
    const cs = new Array<Categorical>();

    dataT.forEach((column) => {
        cs.push(extract_marginal(column));
    });

    return cs;
}

function obj_using_samples(
    theta: number,
    nb_rows: number,
    marginals: Categorical[],
    mi_opt: number
): number {
    if (theta < 0) {
        return Number.NEGATIVE_INFINITY;
    } else if (theta >= 1) {
        return Number.POSITIVE_INFINITY;
    }

    const G = new GaussianCopula(
        [
            [1, theta],
            [theta, 1],
        ],
        marginals
    );

    const discrete_sampleT = G.randT(nb_rows);
    const mi_sample = mutual_information(
        discrete_sampleT[0],
        discrete_sampleT[1]
    );

    return mi_sample - mi_opt;
}

// find correlation between 2 marginals
function find_corr(
    marginal1: Categorical,
    marginal2: Categorical,
    mi_opt: number,
    samples: number
): number {
    const tolerance = 1e-7;
    const max_iter = 1000;
    let iter = 0;

    let lower = -Number.EPSILON;
    let higher = 1;

    let fun_lower = obj_using_samples(
        lower,
        samples,
        [marginal1, marginal2],
        mi_opt
    );

    while (iter <= max_iter) {
        const mid = (lower + higher) / 2;
        const fun = obj_using_samples(
            mid,
            samples,
            [marginal1, marginal2],
            mi_opt
        );

        if (fun == 0 || (higher - lower) / 2 < tolerance) {
            return mid;
        }

        if (Math.sign(fun) == Math.sign(fun_lower)) {
            lower = mid;
            fun_lower = fun;
        } else {
            higher = mid;
        }

        iter += 1;
    }

    console.error('Could not find root!');
    return Number.NaN;
}

function _fit_mle_mi_matrix(
    marginals: Categorical[],
    mi_matrix: number[][],
    data: number[][],
    worker?: Worker
): GaussianCopula {
    const M = data[0].length;

    const corr = math.zeros([M, M]) as number[][];
    let count = 0;
    const totalCount = ((M - 1) * M) / 2;
	let totalTimeTaken = 0;

    for (let i = 0; i < M; i++) {
        for (let j = i + 1; j < M; j++) {
            const m_i = marginals[i];
            const m_j = marginals[j];
            const start = Date.now();
            corr[i][j] = find_corr(m_i, m_j, mi_matrix[i][j], data.length);
            const end = Date.now();
			totalTimeTaken += end - start;
            count += 1;
			// report progress back to worker if worker is used
            if (worker) {
                worker.postMessage({
                    type: 1,
					eta: (totalTimeTaken / count) * (totalCount - count) / 1000,
                    percent: (count / totalCount) * 100,
                });
            }
        }
    }

    // Correct Numerical Errors
    const B = math.add(
        math.add(corr, math.transpose(corr)),
        math.diag(math.ones([M]))
    ) as number[][];

    const ans = math.eigs(B);
    const D = ans.values;
    const V = ans.vectors;

    const D_M = (math.diag(D) as unknown) as number[][];
    for (let i = 0; i < M; i++) {
        D_M[i][i] = D_M[i][i] < 1e-10 ? 1e-10 : D_M[i][i];
    }

    let fixed_corr = math.multiply(math.multiply(V, D_M), math.transpose(V));

    // Numerical floating-point errors can make the matrix non-Hermitian
    fixed_corr = math.multiply(
        math.add(fixed_corr, math.transpose(fixed_corr)),
        0.5
    );

    return new GaussianCopula(fixed_corr, marginals);
}

// fit mle data to Gaussian Copula by composing marginal & mutual information
// functions
export function fit_mle(
    data: number[][],
    samples = 1000,
    worker?: Worker
): GaussianCopula {
    console.log('Fitting Model...');
    const start = Date.now();

    const marginals = extract_marginals(math.transpose(data));

    data = choose_random(data, samples);
    const dataT = math.transpose(data);

    const mi_matrix = mutual_information_matrix(dataT);

    const G = _fit_mle_mi_matrix(marginals, mi_matrix, data, worker);

    const millis = Date.now() - start;
    console.log(`minutes elapsed = ${millis / 60000}`);

    return G;
}
