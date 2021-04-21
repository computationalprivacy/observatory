// functions to get individual and population uniqueness as predicted by
// GaussianCopula model
import { GaussianCopula } from './distributions';
import { randVec, resetRNG } from './utils';
import { call_mvndst } from './call_mvndst';
import * as math from 'mathjs';
import jstat from 'jstat';

// helper function to get individual uniqueness
function smooth_weight(g: GaussianCopula, indiv: number[], scaleProb?: number[]): number[] {
    const M = indiv.length;
    const iter = 50;

    const deltaI = math.zeros([M]) as number[];
    for (let i = 0; i < M; i++) {
        if (!isNaN(indiv[i])) {
            deltaI[i] = g.marginals[i].pdf(indiv[i]);
        } else {
            deltaI[i] = 0;
        }

		if (scaleProb) {
			deltaI[i] *= scaleProb[i];
		}
    }

    const cell_probs = math.zeros([iter]) as number[];
    resetRNG();
    for (let i = 0; i < iter; i++) {
        let lower = randVec(M);
        for (let j = 0; j < lower.length; j++) {
            lower[j] *= 1 - deltaI[j];
        }

        let upper = math.add(lower, deltaI) as number[];

        lower = lower.map((n) => jstat.normal.inv(n, 0, 1));
        upper = upper.map((n) => jstat.normal.inv(n, 0, 1));

        for (let j = 0; j < indiv.length; j++) {
            if (isNaN(indiv[j])) {
                lower[j] = Number.NEGATIVE_INFINITY;
                upper[j] = Number.POSITIVE_INFINITY;
            }
        }

        cell_probs[i] = call_mvndst(lower, upper, g.corr);
    }

    return cell_probs;
}

// get probability of drawing an indiv from distribution
export function probDrawing(g: GaussianCopula, indiv: number[], scaleProb?: number[]): number {
    const cells = smooth_weight(g, indiv, scaleProb);
    return math.mean(cells).toPrecision(2);
}

// get uniqueness of individual in a given Gaussian Copula
export function indiv_uniqueness(
    g: GaussianCopula,
    indiv: number[],
	n: number,
	scaleProb?: number[]
): [number, number] {
    const p_avg = probDrawing(g, indiv, scaleProb);

    return [Math.pow(1 - p_avg, n - 1), p_avg];
}

// get correctness together with the probability of drawing
export function correctness_with_prob(
    g: GaussianCopula,
    indiv: number[],
	n: number,
	scaleProb?: number[]
): [number, number] {
    const [u, p] = indiv_uniqueness(g, indiv, n, scaleProb);
    const k = ((1 / n) * (1 - u ** (n / (n - 1)))) / (1 - u ** (1 / (n - 1)));
    return [k, p];
}

// get correctness of re-identification of individual in a given Gaussian Copula
export function correctness(
    g: GaussianCopula,
    indiv: number[],
	n: number,
	scaleProb?: number[]
): number {
    return correctness_with_prob(g, indiv, n, scaleProb)[0];
}
