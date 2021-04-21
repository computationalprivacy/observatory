// functions to get individual and population uniqueness as predicted by
// GaussianCopula model
import { GaussianCopula } from './distributions';
import { count_map } from './utils';

// get uniqueness of dataset given the gaussian copula
export function pop_uniqueness(g: GaussianCopula, samples = 1000): number {
    const discrete_sampleT = g.randT(samples);

    const hashed_arr = new Array<string>();

    for (let i = 0; i < discrete_sampleT[0].length; i++) {
        let record = '';
        for (let j = 0; j < discrete_sampleT.length; j++) {
            record += discrete_sampleT[j][i];
            if (j != discrete_sampleT.length - 1) {
                record += ' ';
            }
        }

        hashed_arr.push(record);
    }

    const cm = count_map(hashed_arr);
    let total_unique = 0;
    for (const category in cm) {
        if (cm[category] == 1) {
            total_unique += 1;
        }
    }

    return total_unique / samples;
}
