// functions to help with training of copula
import { Categorical } from './distributions';
import { prob_map, shuffle } from './utils';
import * as math from 'mathjs';

// estimate entropy in column using naive (frequencies based / Shannon) method
function estimate_entropy(column: (string | number | symbol)[]): number {
    const pm = prob_map(column);

    let entropy = 0;
    for (const key in pm) {
        entropy += pm[key] * Math.log(pm[key]);
    }

    return -entropy;
}

// calculate entropy between 2 attributes
function estimate_joint_entropy(x: number[], y: number[]): number {
    if (x.length != y.length) {
        console.error(`Vectors need to be of the same length when estimating
						join entropy!`);
        return Number.NaN;
    }

    const hashed_arr = new Array<string>();
    for (let i = 0; i < x.length; i++) {
        hashed_arr.push(`${x[i]} ${y[i]}`);
    }

    return estimate_entropy(hashed_arr);
}

// calculate mutual information between 2 attributes
// without normalization, with adjustment
export function mutual_information(x: number[], y: number[]): number {
    // calculate joint entropy without normalization or adjustment
    const ee = estimate_joint_entropy(x, y);

    // adjust mutual info
    const ee_shuffle = estimate_joint_entropy(x, shuffle(y));
    const mi = ee_shuffle - ee;

    return mi;
}

// calculate mutual information across all pairs of attributes
export function mutual_information_matrix(dataT: number[][]): number[][] {
    const M = dataT.length;
    const mi = math.zeros([M, M]) as number[][];

    for (let i = 0; i < M; i++) {
        mi[i][i] = estimate_entropy(dataT[i]);
    }

    for (let i = 0; i < M; i++) {
        for (let j = i + 1; j < M; j++) {
            mi[i][j] = mutual_information(dataT[i], dataT[j]);

            // drop null, negative or NaN values
            if ( isNaN(mi[i][j]) || mi[i][j] < Number.EPSILON) {
                mi[i][j] = 0;
            }

            mi[j][i] = mi[i][j];
        }
    }

    return mi;
}

// function to extract marginal distribution of each attribute
export function extract_marginal(column: number[]): Categorical {
    const entries: [number, number][] = [];
    const pm = prob_map(column);
    for (const category in pm) {
        entries.push([parseInt(category), pm[category]]);
    }

    const probs = entries.sort((a, b) => a[0] - b[0]).map((a) => a[1]);

    return new Categorical(probs);
}
