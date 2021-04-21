// utility functions to call mvndst routine
import * as math from 'mathjs';

// declare type of Module (WASM interface)
interface ExtendedEmModule extends EmscriptenModule {
	ccall: typeof ccall; // call function
	getValue: typeof getValue; // get value held by pointer
	setValue: typeof setValue; // set value at pointer
}

// expect Module to be previously defined (through <script> tag)
declare const Module: ExtendedEmModule;

// prepare data to call mvndst routine
export function call_mvndst(
    lower: number[],
    upper: number[],
    corr: number[][]
): number {
    const N = lower.length;

    const infin = math.zeros([N]) as number[];
    for (let i = 0; i < N; i++) {
        const lowinf = lower[i] == Number.NEGATIVE_INFINITY;
        const uppinf = upper[i] == Number.POSITIVE_INFINITY;

        if (lowinf && uppinf) {
            infin[i] = -1;
        } else if (lowinf) {
            infin[i] = 0;
        } else if (uppinf) {
            infin[i] = 1;
        } else {
            infin[i] = 2;
        }
    }

    const flat_corr = new Array<number>();
    for (let i = 0; i < N; i++) {
        for (let j = 0; j < i - 1; j++) {
            flat_corr.push(corr[i][j]);
        }
    }

    return mvndst(lower, upper, infin, flat_corr);
}

// call mvndst routine compiled in Module
function mvndst(
    lower: number[],
    higher: number[],
    infin: number[],
    correl: number[],
    maxpts = 2000,
    abseps = 1e-6,
    releps = 1e-6
): number {
    const n = lower.length;
    const lower_ptr = array_to_ptr(lower, false);
    const upper_ptr = array_to_ptr(higher, false);
    const infin_ptr = array_to_ptr(infin, true);
    const correl_ptr = array_to_ptr(correl, false);
    const err_ptr = Module._malloc(8);
    const val_ptr = Module._malloc(8);
    const inform_ptr = Module._malloc(8);

    Module.ccall(
        'mvndst',
        null,
        [
            'number',
            'number',
            'number',
            'number',
            'number',
            'number',
            'number',
            'number',
            'number',
            'number',
            'number',
        ],
        [
            n,
            lower_ptr,
            upper_ptr,
            infin_ptr,
            correl_ptr,
            maxpts,
            abseps,
            releps,
            err_ptr,
            val_ptr,
            inform_ptr,
        ]
    );

	// get result which is held at val_ptr
    const val = Module.getValue(val_ptr, 'double');

	// free all data
    Module._free(lower_ptr);
    Module._free(upper_ptr);
    Module._free(infin_ptr);
    Module._free(correl_ptr);
    Module._free(err_ptr);
    Module._free(val_ptr);
    Module._free(inform_ptr);

    return val;
}

// helper function to convert JS array into Module pointer
function array_to_ptr(arr: number[], isInt: boolean): number {
    const sizeof_element = isInt ? 4 : 8;
    const element_type = isInt ? 'i32' : 'double';

    const ptr = Module._malloc(arr.length * sizeof_element);
    for (let i = 0; i < arr.length; i++) {
        Module.setValue(ptr + i * sizeof_element, arr[i], element_type);
    }

    return ptr;
}

// test whether routine is working correctly with some preset values
export function module_test(): void {
    const n = 2;
    const lower_ptr = array_to_ptr([-1.0, 0.0], false);
    const upper_ptr = array_to_ptr([2.0, 1.0], false);
    const infin_ptr = array_to_ptr([2, 2], true);
    const correl_ptr = array_to_ptr([0.5], false);
    const maxpts = 2000;
    const abseps = 1e-6;
    const releps = 1e-6;
    const err_ptr = Module._malloc(8);
    const val_ptr = Module._malloc(8);
    const inform_ptr = Module._malloc(8);

    Module.ccall(
        'mvndst',
        null,
        [
            'number',
            'number',
            'number',
            'number',
            'number',
            'number',
            'number',
            'number',
            'number',
            'number',
            'number',
        ],
        [
            n,
            lower_ptr,
            upper_ptr,
            infin_ptr,
            correl_ptr,
            maxpts,
            abseps,
            releps,
            err_ptr,
            val_ptr,
            inform_ptr,
        ]
    );
}
