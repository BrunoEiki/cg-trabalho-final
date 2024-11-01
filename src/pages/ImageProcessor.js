import React, { useState, useRef } from "react";

const ImageProcessor = () => {
	const [originalImage, setOriginalImage] = useState(null);
	const [processedImage, setProcessedImage] = useState(null);
	const [conversionMethod, setConversionMethod] = useState("average");
	const [edgeDetectionMethod, setEdgeDetectionMethod] = useState("sobel");
	const fileInputRef = useRef(null);

	const [isGrayImage, setIsGrayImage] = useState(false);

	const applyGaussianFilter = (data, index, width) => {
		const kernel = [
			[1 / 16, 2 / 16, 1 / 16],
			[2 / 16, 4 / 16, 2 / 16],
			[1 / 16, 2 / 16, 1 / 16],
		];

		let r = 0,
			g = 0,
			b = 0;
		const halfKernelSize = 1;

		for (let ky = -halfKernelSize; ky <= halfKernelSize; ky++) {
			for (let kx = -halfKernelSize; kx <= halfKernelSize; kx++) {
				const x = ((index / 4) % width) + kx;
				const y = Math.floor(index / 4 / width) + ky;

				if (
					x >= 0 &&
					x < width &&
					y >= 0 &&
					y < data.length / 4 / width
				) {
					const pixelIndex = (y * width + x) * 4;
					const weight =
						kernel[ky + halfKernelSize][kx + halfKernelSize];

					r += data[pixelIndex] * weight;
					g += data[pixelIndex + 1] * weight;
					b += data[pixelIndex + 2] * weight;
				}
			}
		}

		// Retorna a média dos canais RGB
		return Math.round((r + g + b) / 3);
	};

	const processImage = (type) => {
		if (!originalImage) return;

		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d");
		canvas.width = originalImage.width;
		canvas.height = originalImage.height;
		ctx.drawImage(
			originalImage,
			0,
			0,
			originalImage.width,
			originalImage.height
		);

		const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
		const data = imageData.data;

		switch (type) {
			case "grayscale":
				for (let i = 0; i < data.length; i += 4) {
					let value;
					switch (conversionMethod) {
						case "average":
							value = (data[i] + data[i + 1] + data[i + 2]) / 3;
							break;
						case "median":
							value = [data[i], data[i + 1], data[i + 2]].sort(
								(a, b) => a - b
							)[1];
							break;
						case "gaussian":
							value = applyGaussianFilter(data, i, canvas.width);
							break;
					}
					data[i] = data[i + 1] = data[i + 2] = value; // escala de cinza, tudo o mesmo valor
				}
				break;

			case "binary":
				for (let i = 0; i < data.length; i += 4) {
					let grayValue;
					switch (conversionMethod) {
						case "average":
							grayValue =
								(data[i] + data[i + 1] + data[i + 2]) / 3;
							break;
						case "median":
							grayValue = [
								data[i],
								data[i + 1],
								data[i + 2],
							].sort((a, b) => a - b)[1];
							break;
						case "gaussian":
							grayValue = applyGaussianFilter(
								data,
								i,
								canvas.width
							);
							break;
					}
					const binaryValue = grayValue > 128 ? 255 : 0;
					data[i] = data[i + 1] = data[i + 2] = binaryValue;
				}
				break;
			case "noise-reduction":
				const reducedData = applyNoiseReduction(
					data,
					canvas.width,
					canvas.height,
					conversionMethod
				);
				imageData.data.set(reducedData);
				break;
		}

		ctx.putImageData(imageData, 0, 0);
		setProcessedImage(canvas.toDataURL());
	};

	const convertToRGB = () => {
		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d");
		canvas.width = originalImage.width;
		canvas.height = originalImage.height;

		ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
		const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
		const data = imageData.data;

		for (let i = 0; i < data.length; i += 4) {
			// Mantém o valor de cinza, mas garante que seja um pixel RGB
			const grayValue = data[i];

			data[i] = grayValue; // Red
			data[i + 1] = grayValue; // Green
			data[i + 2] = grayValue; // Blue
			data[i + 3] = 255; // Alpha
		}

		ctx.putImageData(imageData, 0, 0);
		setProcessedImage(canvas.toDataURL());
		// return canvas.toDataURL();
	};

	const applyNoiseReduction = (data, width, height, method) => {
		const newData = new Uint8ClampedArray(data);

		// Kernel size for noise reduction (3x3 neighborhood)
		const kernelSize = 3;
		const halfKernelSize = Math.floor(kernelSize / 2);

		for (let y = halfKernelSize; y < height - halfKernelSize; y++) {
			for (let x = halfKernelSize; x < width - halfKernelSize; x++) {
				for (let channel = 0; channel < 3; channel++) {
					// 3 canais
					const neighborValues = [];
					for (let ky = -halfKernelSize; ky <= halfKernelSize; ky++) {
						for (let kx = -halfKernelSize; kx <= halfKernelSize; kx++) {
							const pixelIndex =
								((y + ky) * width + (x + kx)) * 4 + channel;
							neighborValues.push(data[pixelIndex]);
						}
					}

					let reducedValue;
					switch (method) {
						case "average":
							// Simple arithmetic mean
							reducedValue =
								neighborValues.reduce((a, b) => a + b, 0) /
								neighborValues.length;
							break;
						case "median":
							// Median filter
							neighborValues.sort((a, b) => a - b);
							reducedValue =
								neighborValues[
									Math.floor(neighborValues.length / 2)
								];
							break;
						case "gaussian":
							// Weighted average (Gaussian filter)
							const gaussianKernel = [
								[1 / 16, 2 / 16, 1 / 16],
								[2 / 16, 4 / 16, 2 / 16],
								[1 / 16, 2 / 16, 1 / 16],
							];

							reducedValue = 0;
							for (
								let ky = -halfKernelSize;
								ky <= halfKernelSize;
								ky++
							) {
								for (
									let kx = -halfKernelSize;
									kx <= halfKernelSize;
									kx++
								) {
									const pixelIndex =
										((y + ky) * width + (x + kx)) * 4 +
										channel;
									const weight =
										gaussianKernel[ky + halfKernelSize][
											kx + halfKernelSize
										];
									reducedValue += data[pixelIndex] * weight;
								}
							}
							break;
					}

					newData[(y * width + x) * 4 + channel] =
						Math.round(reducedValue);
				}
			}
		}

		return newData;
	};

	const applyEdgeDetection = () => {
		if (!originalImage) return;

		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d");
		canvas.width = originalImage.width;
		canvas.height = originalImage.height;

		ctx.drawImage(
			originalImage,
			0,
			0,
			originalImage.width,
			originalImage.height
		);

		const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
		const data = imageData.data;
		const width = canvas.width;
		const height = canvas.height;

		// Convert to grayscale first
		const grayData = new Uint8ClampedArray(width * height);
		for (let i = 0; i < data.length; i += 4) {
			grayData[i / 4] = (data[i] + data[i + 1] + data[i + 2]) / 3;
		}

		// Edge detection kernels
		const sobelXKernel = [
			[-1, 0, 1],
			[-2, 0, 2],
			[-1, 0, 1],
		];

		const sobelYKernel = [
			[-1, -2, -1],
			[0, 0, 0],
			[1, 2, 1],
		];

		const prewittXKernel = [
			[-1, 0, 1],
			[-1, 0, 1],
			[-1, 0, 1],
		];

		const prewittYKernel = [
			[-1, -1, -1],
			[0, 0, 0],
			[1, 1, 1],
		];

		// Canny edge detection helper functions
		const gaussianBlur = (grayData, width, height) => {
			const blurredData = new Uint8ClampedArray(grayData.length);
			const gaussianKernel = [
				[1 / 16, 2 / 16, 1 / 16],
				[2 / 16, 4 / 16, 2 / 16],
				[1 / 16, 2 / 16, 1 / 16],
			];

			for (let y = 1; y < height - 1; y++) {
				for (let x = 1; x < width - 1; x++) {
					let sum = 0;
					for (let ky = -1; ky <= 1; ky++) {
						for (let kx = -1; kx <= 1; kx++) {
							const pixelIndex = (y + ky) * width + (x + kx);
							sum +=
								grayData[pixelIndex] *
								gaussianKernel[ky + 1][kx + 1];
						}
					}
					blurredData[y * width + x] = sum;
				}
			}
			return blurredData;
		};

		const computeGradient = (
			blurredData,
			width,
			height,
			xKernel,
			yKernel
		) => {
			const gradientData = new Uint8ClampedArray(width * height);
			const directions = new Float32Array(width * height);

			for (let y = 1; y < height - 1; y++) {
				for (let x = 1; x < width - 1; x++) {
					let gx = 0,
						gy = 0;
					for (let ky = -1; ky <= 1; ky++) {
						for (let kx = -1; kx <= 1; kx++) {
							const pixelIndex = (y + ky) * width + (x + kx);
							gx +=
								blurredData[pixelIndex] *
								xKernel[ky + 1][kx + 1];
							gy +=
								blurredData[pixelIndex] *
								yKernel[ky + 1][kx + 1];
						}
					}

					const magnitude = Math.sqrt(gx * gx + gy * gy);
					gradientData[y * width + x] = Math.min(magnitude, 255);
					directions[y * width + x] = Math.atan2(gy, gx);
				}
			}
			return { gradientData, directions };
		};

		// afinar as bordas
		const nonMaxSuppression = (gradientData, directions, width, height) => {
			const suppressedData = new Uint8ClampedArray(gradientData);

			for (let y = 1; y < height - 1; y++) {
				for (let x = 1; x < width - 1; x++) {
					const angle = directions[y * width + x];
					const mag = gradientData[y * width + x];

					let neighbor1 = 255,
						neighbor2 = 255;

					// horizontal
					if (
						(angle >= -Math.PI / 8 && angle < Math.PI / 8) ||
						angle < (-7 * Math.PI) / 8 ||
						angle >= (7 * Math.PI) / 8
					) {
						neighbor1 = gradientData[y * width + (x + 1)];
						neighbor2 = gradientData[y * width + (x - 1)];
						// diagonal 45
					} else if (
						(angle >= Math.PI / 8 && angle < (3 * Math.PI) / 8) ||
						(angle >= (-7 * Math.PI) / 8 &&
							angle < (-5 * Math.PI) / 8)
					) {
						neighbor1 = gradientData[(y + 1) * width + (x + 1)];
						neighbor2 = gradientData[(y - 1) * width + (x - 1)];
					// vertical
					} else if (
						(angle >= (3 * Math.PI) / 8 &&
							angle < (5 * Math.PI) / 8) ||
						(angle >= (-5 * Math.PI) / 8 &&
							angle < (-3 * Math.PI) / 8)
					) {
						neighbor1 = gradientData[(y + 1) * width + x];
						neighbor2 = gradientData[(y - 1) * width + x];
						// diagonal 135
					} else {
						neighbor1 = gradientData[(y + 1) * width + (x - 1)];
						neighbor2 = gradientData[(y - 1) * width + (x + 1)];
					}

					// Suppress non-maximum pixels
					if (mag < neighbor1 || mag < neighbor2) {
						suppressedData[y * width + x] = 0;
					}
				}
			}

			return suppressedData;
		};

		const doubleThreshold = (
			suppressedData,
			width,
			height,
			lowThreshold = 0.1,
			highThreshold = 0.3
		) => {
			const thresholdedData = new Uint8ClampedArray(suppressedData);
			const maxVal = Math.max(...suppressedData);
			const lowThresholdVal = maxVal * lowThreshold; // se menor, descarta
			const highThresholdVal = maxVal * highThreshold; // se maior, seleciona -> borda forte

			for (let y = 1; y < height - 1; y++) {
				for (let x = 1; x < width - 1; x++) {
					const val = suppressedData[y * width + x];

					if (val >= highThresholdVal) {
						thresholdedData[y * width + x] = 255;
					} else if (val < lowThresholdVal) {
						thresholdedData[y * width + x] = 0;
					} else {
						// próximo de borda forte?
						let isConnectedToStrongEdge = false;
						for (let ky = -1; ky <= 1; ky++) {
							for (let kx = -1; kx <= 1; kx++) {
								if (
									thresholdedData[
										(y + ky) * width + (x + kx)
									] === 255
								) {
									isConnectedToStrongEdge = true;
									break;
								}
							}
							if (isConnectedToStrongEdge) break;
						}

						thresholdedData[y * width + x] = isConnectedToStrongEdge
							? 255
							: 0;
					}
				}
			}

			return thresholdedData;
		};

		let processedData;
		switch (edgeDetectionMethod) {
			case "sobel": {
				const { gradientData } = computeGradient(
					grayData,
					width,
					height,
					sobelXKernel,
					sobelYKernel
				);
				processedData = gradientData;
				break;
			}
			case "prewitt": {
				const { gradientData } = computeGradient(
					grayData,
					width,
					height,
					prewittXKernel,
					prewittYKernel
				);
				processedData = gradientData;
				break;
			}
			case "canny": {
				// Canny edge detection pipeline
				const blurredData = gaussianBlur(grayData, width, height);
				const { gradientData, directions } = computeGradient(
					blurredData,
					width,
					height,
					sobelXKernel,
					sobelYKernel
				);
				const suppressedData = nonMaxSuppression(
					gradientData,
					directions,
					width,
					height
				);
				processedData = doubleThreshold(suppressedData, width, height);
				break;
			}
		}

		const processedImageData = ctx.createImageData(width, height);
		for (let i = 0; i < processedData.length; i++) {
			const value = processedData[i];
			processedImageData.data[i * 4] = value; // Red
			processedImageData.data[i * 4 + 1] = value; // Green
			processedImageData.data[i * 4 + 2] = value; // Blue
			processedImageData.data[i * 4 + 3] = 255; // Alpha
		}

		ctx.putImageData(processedImageData, 0, 0);
		setProcessedImage(canvas.toDataURL());
	};


	const handleImageUpload = (event) => {
		const file = event.target.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = (e) => {
				const img = new Image();
				img.onload = () => {
					setOriginalImage(img);
					setProcessedImage(e.target.result);
				};
				img.src = e.target.result;
			};
			reader.readAsDataURL(file);
		}
	};

	return (
		<div className="flex w-screen h-screen p-4 space-x-4">
			<div className="w-1/2 border border-gray-300 flex flex-col">
				<h2 className="p-2 text-xl font-semibold border-b">
					Imagem Original
				</h2>
				<div className="flex-1 flex justify-center items-center">
					<input
						type="file"
						ref={fileInputRef}
						onChange={handleImageUpload}
						accept="image/*"
						className="hidden"
					/>
					{originalImage && (
						<img
							src={originalImage.src}
							alt="Imagem original"
							className="max-w-full max-h-full object-contain overflow-auto"
						/>
					)}
				</div>
				<button
					onClick={() => fileInputRef.current.click()}
					className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
				>
					{originalImage ? "Trocar Imagem" : "Importar Imagem"}
				</button>
			</div>

			<div className="w-1/2 border border-gray-300 flex flex-col">
				<h2 className="p-2 text-xl font-semibold border-b">
					Processamento de Imagem
				</h2>
				<div className="p-4 space-y-4">
					<div className="space-y-2">
						<label htmlFor="conversion-method" className="block">
							Método de Conversão:
						</label>
						<select
							id="conversion-method"
							value={conversionMethod}
							onChange={(e) =>
								setConversionMethod(e.target.value)
							}
							className="w-full p-2 border rounded"
						>
							<option value="average">Média</option>
							<option value="median">Mediana</option>
							<option value="gaussian">Gaussiano</option>
						</select>
					</div>

					<div className="flex space-x-2">
						<button
							onClick={() => processImage("grayscale")}
							disabled={!originalImage}
							className="flex-1 px-4 py-2 bg-blue-500 text-white rounded 
                         hover:bg-blue-600 transition 
                         disabled:bg-gray-300 disabled:cursor-not-allowed"
						>
							RGB para Tons de Cinza
						</button>
						<button
							onClick={() => processImage("binary")}
							disabled={!originalImage}
							className="flex-1 px-4 py-2 bg-orange-500 text-white rounded 
                         hover:bg-orange-600 transition
                         disabled:bg-gray-300 disabled:cursor-not-allowed"
						>
							Para Imagem Binária
						</button>

						<button
							onClick={convertToRGB}
							disabled={!processedImage || isGrayImage}
							className="flex-1 px-4 py-2 bg-purple-500 text-white rounded 
                     hover:bg-purple-600 transition
                     disabled:bg-gray-300 disabled:cursor-not-allowed"
						>
							Converter para RGB
						</button>

						<button
							onClick={() => processImage("noise-reduction")}
							disabled={!originalImage}
							className="flex-1 px-4 py-2 bg-red-500 text-white rounded 
								hover:bg-red-600 transition
								disabled:bg-gray-300 disabled:cursor-not-allowed"
						>
							Redução de Ruído
						</button>

						
					</div>

					<div className="space-y-2">
						<label htmlFor="edge-detection-method" className="block">
							Método de Detecção de Bordas:
						</label>
						<select
							id="edge-detection-method"
							value={edgeDetectionMethod}
							onChange={(e) =>
								setEdgeDetectionMethod(e.target.value)
							}
							className="w-full p-2 border rounded"
						>
							<option value="sobel">Sobel</option>
							<option value="prewitt">Prewitt</option>
							<option value="canny">Canny</option>
						</select>
					</div>

					<button
						onClick={applyEdgeDetection}
						disabled={!originalImage}
						className="w-full px-4 py-2 bg-green-500 text-white rounded 
                         hover:bg-green-600 transition 
                         disabled:bg-gray-300 disabled:cursor-not-allowed"
					>
						Detectar Bordas
					</button>

					{/* ... (rest of the existing component) */}

					<div className="border p-2 mt-4">
						<h3 className="text-lg font-semibold mb-2">
							Imagem Processada
						</h3>
						{processedImage ? (
							<img
								src={processedImage}
								alt="Imagem processada"
								className="max-w-full max-h-full object-contain mx-auto"
							/>
						) : (
							<p className="text-center text-gray-500">
								Nenhuma imagem processada
							</p>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default ImageProcessor;
