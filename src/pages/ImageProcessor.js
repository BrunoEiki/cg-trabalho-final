import React, { useState, useRef } from "react";

const ImageProcessor = () => {
	const [originalImage, setOriginalImage] = useState(null);
	const [processedImage, setProcessedImage] = useState(null);
	const [conversionMethod, setConversionMethod] = useState("average");
	const fileInputRef = useRef(null);

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
					data[i] = data[i + 1] = data[i + 2] = value;
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
		}

		ctx.putImageData(imageData, 0, 0);
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
					</div>

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
