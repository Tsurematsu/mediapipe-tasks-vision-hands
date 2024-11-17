import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

function drawHandLandmarks(ctx, hands) {
	for (const hand of hands) {
		for (const landmark of hand) {
			const { x, y } = landmark;
			ctx.beginPath();
			ctx.arc(x * ctx.canvas.width, y * ctx.canvas.height, 5, 0, 2 * Math.PI);
			ctx.fillStyle = "red";
			ctx.fill();
		}
	}
}

async function makeHandLandmarker() {
	const vision = await FilesetResolver.forVisionTasks("./public/wasm/");
	const result = await HandLandmarker.createFromOptions(vision, {
		baseOptions: {
			modelAssetPath: "./public/task/hand_landmarker.task",
			delegate: "GPU",
		},
		runningMode: "VIDEO",
		numHands: 2,
	});
	return result;
}

async function loopRecording(ctx, video, handLandmarker, lastTimeVideo) {
	let lastParam = lastTimeVideo ?? -1;
	let results = {};
	if (lastTimeVideo !== video.currentTime) {
		lastParam = video.currentTime;
		results = handLandmarker.detectForVideo(video, performance.now());
	}
	if (results.landmarks) {
		ctx.save();
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		console.log(results.landmarks);
		drawHandLandmarks(ctx, results.landmarks);
		ctx.restore();
	}
	window.requestAnimationFrame(() =>
		loopRecording(ctx, video, handLandmarker, lastParam),
	);
}

async function configCanvas(canvas, video) {
	const ctx = canvas.getContext("2d");
	canvas.width = video.videoWidth;
	canvas.height = video.videoHeight;
	canvas.style.width = `${video.videoWidth}px`;
	canvas.style.height = `${video.videoHeight}px`;
	return ctx;
}

async function getCameraStream() {
	return await navigator.mediaDevices.getUserMedia({ video: true });
}

async function main() {
	// biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
	const callback = (r, video) => (video.onloadedmetadata = r);
	const stream = await getCameraStream();
	const video = document.querySelector("video");
	const canvas = document.querySelector("canvas");
	if (video) video.srcObject = stream;
	if (video) await new Promise((resolve) => callback(resolve, video));
	if (video) video.play();
	const ctx = await configCanvas(canvas, video);
	const handLandmarker = await makeHandLandmarker();
	loopRecording(ctx, video, handLandmarker);
}

main();
