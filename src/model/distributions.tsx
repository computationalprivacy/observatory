// classes to represent Distributions: Categorical and GaussianCopula
import * as math from 'mathjs';
import jstat from 'jstat';
import { pd_chol } from './utils';

export class Categorical {
    // list of probabilities for each category
    private probs: number[];

    // list of cumulative probabilities for each category
    private cdf: number[];

    constructor(probs: number[]) {
        this.probs = probs;
        this.cdf = [];

        // convert pdf to cdf
        let sum_prob = 0;
        for (const prob of this.probs) {
            sum_prob += prob;
            this.cdf.push(sum_prob);
        }
    }

    pdf(index: number): number {
        if (index < 0 || index > this.probs.length) {
            console.error(`pdf undefined! ${index}`);
            return Number.NaN;
        }

        return this.probs[index];
    }

    // getter
    getProbs(): number[] {
        return this.probs;
    }

    // inverse cdf
    // find leftmost element in cdf such that
    // cdf of element >= p using Binary Search
    quantile(p: number): number {
        let lower = 0;
        let higher = this.cdf.length;

        while (lower < higher) {
            const m = Math.floor((lower + higher) / 2);
            if (this.cdf[m] < p) {
                lower = m + 1;
            } else {
                higher = m;
            }
        }

        return lower;
    }

    // find the mean probability
    // and pick the category that is closest to the mean
    invMeanPdf(): number {
        return Math.floor(
            math.sum(
                math.multiply(math.range(`0:${this.probs.length}`), this.probs)
            )
        );
    }
}

export class GaussianCopula {
    corr: number[][];
    marginals: Categorical[];

    constructor(corr: number[][], marginals: Categorical[]) {
        this.corr = corr;
        this.marginals = marginals;
    }

	// test time taken to generate random samples from distribution
    testRandT(): void {
        const num_samples = 300000;
        const dist = new MvNormal(this.corr);

        const start = Date.now();
        dist.randT(num_samples);
        const end = Date.now();
        console.log(
            `Time taken to generate ${num_samples} samples : ${end - start} ms`
        );
    }

	// select random samples from distributions in transposed fashion
	// so that time is not wasted transposing matrices
    randT(nb_rows: number): number[][] {
        // gaussian_rvs to get continuous_sample
        const dist = new MvNormal(this.corr);
        const continuous_sampleT = dist.randT(nb_rows);
        for (let i = 0; i < this.corr.length; i++) {
            for (let j = 0; j < nb_rows; j++) {
                continuous_sampleT[i][j] = jstat.normal.cdf(
                    continuous_sampleT[i][j],
                    0,
                    1
                );
            }
        }

        // apply marginals onto continuous_sample to get random
        const discrete_dataT = math.zeros([
            this.corr.length,
            nb_rows,
        ]) as number[][];
        for (let i = 0; i < continuous_sampleT.length; i++) {
            for (let j = 0; j < continuous_sampleT[i].length; j++) {
                discrete_dataT[i][j] = this.marginals[i].quantile(
                    continuous_sampleT[i][j]
                );
            }
        }

        return discrete_dataT;
    }
}

export class MvNormal {
    private cov: number[][];
	private L: number[][]; // cholesky decomposition

    constructor(cov: number[][]) {
        this.cov = cov;
        this.L = pd_chol(cov);
    }

	// select random samples from distributions in transposed fashion
	// so that time is not wasted transposing matrices
    randT(nb_rows: number): number[][] {
        const u = math.zeros([this.cov.length, nb_rows]) as number[][];
        for (let i = 0; i < this.cov.length; i++) {
            for (let j = 0; j < nb_rows; j++) {
                u[i][j] = jstat.normal.sample(0, 1);
            }
        }

        return math.multiply(this.L, u) as number[][];
    }
}
