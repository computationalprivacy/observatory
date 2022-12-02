// define utility functions for calculations
import * as math from 'mathjs';
var _ = require('lodash');
import Rand from 'rand-seed';

// compute cholesky decomposition for positive definite matrix
export function pd_chol(A: number[][]): number[][] {
    const L = math.zeros([A.length, A.length]) as number[][];

    for (let i = 0; i < A.length; i++) {
        for (let j = 0; j <= i; j++) {
            if (i == j) {
                let sumL = 0;
                for (let k = 0; k < j; k++) {
                    sumL += L[j][k] * L[j][k];
                }

                // since A is PD, diagonal must be positive
                L[i][j] = Math.sqrt(A[i][j] - sumL);
            } else {
                let sumL = 0;
                for (let k = 0; k < j; k++) {
                    sumL += L[i][k] * L[j][k];
                }

                L[i][j] = (1 / L[j][j]) * (A[i][j] - sumL);
            }
        }
    }

    return L;
}

// choose random samples from data
export function choose_random<T>(data: T[][], n: number): T[][] {
    if (data.length > n) {
        return _.sampleSize(data, n)
        // const indices = range(0, data.length);
        // const selected = pickRandom(indices, n);
        // let samples = new Array<Array<T>>(n);
        // console.log("indices:", indices, "selected:", selected, "samples:", samples);

        // console.log(indices.size(), selected.size())
        // for (let i = 0; i < n; i++) {
        //     let ix = selected[i]
        //     samples[i] = data[ix];
        //     console.log(i, ix, data[ix], samples[i])
        // }
        // console.log("samples:", samples);

        // return samples;
    }

    return data;
}

// global RNG with initial seed
let rng = new Rand('privacy-demo-v2');
export function resetRNG(): void {
    rng = new Rand('privacy-demo-v2');
}

// create random vector of size n
export function randVec(n: number): number[] {
    const vec = math.zeros([n]) as number[];
    for (let i = 0; i < n; i++) {
        vec[i] = rng.next();
    }

    return vec;
}

// count number of occurrences for each unique element in column
export function count_map<T extends Indexable>(column: T[]): Record<T, number> {
    const mymap: Record<T, number> = {} as Record<T, number>;
    column.forEach((val) => {
        if (val in mymap) {
            mymap[val] += 1;
        } else {
            mymap[val] = 1;
        }
    });

    return mymap;
}

// convert count map to map of probabilities
export function prob_map<T extends Indexable>(column: T[]): Record<T, number> {
    console.log("prob_map column:", column)
    const cm = count_map(column);
    const pm: Record<T, number> = {} as Record<T, number>;

    for (const key in cm) {
        pm[key] = cm[key] / column.length;
    }

    return pm;
}

// shuffle a column up randomly
export function shuffle<T>(column: T[]): T[] {
    const shuffled_col = column.slice(0);

    let index = shuffled_col.length,
        temp_val,
        rand_num;

    // while there are remaining elements to shuffle
    while (index) {
        // pick random element that has not yet been shuffled
        rand_num = Math.floor(Math.random() * index--);

        // swap randomly chosen element with current element
        temp_val = shuffled_col[index];
        shuffled_col[index] = shuffled_col[rand_num];
        shuffled_col[rand_num] = temp_val;
    }

    return shuffled_col;
}

type Indexable = string | number | symbol;
