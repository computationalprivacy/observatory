// Web Worker trains model in a separate thread from main UI
import { fit_mle } from './model/model_gen';

const ctx: Worker = self as unknown as Worker;

// worker receives data when message event is fired
ctx.addEventListener('message', (data) => {
	if (!data) return;

	// extract training data from argument
	const numData = data.data as number[][];
	console.log("data:", data)
	console.log("numData:", numData)

	// train model on 1000 samples
	const G = fit_mle(numData, 1000, ctx);

	// inform parent process of completion 
	ctx.postMessage({ type: 0, G: G });
});