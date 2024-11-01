import React, { useState } from "react";

import NavBar from "../components/NavBar";
import { Routes, Route } from "react-router-dom";

import ImageProcessing from "../pages/ImageProcessor";

const GRID_SIZE = 21;

const DrawingGrid = () => {
	const [grid, setGrid] = useState(
		Array(GRID_SIZE)
			.fill()
			.map(() => Array(GRID_SIZE).fill(false))
	);

	// ! ======================
	// ! ===== VARIÁVEIS =====
	// ! ======================
	// linhas e poligonos
	const [selectedPoints, setSelectedPoints] = useState([]);
	const [color, setColor] = useState("blue"); // Cor padrão
	const [algorithm, setAlgorithm] = useState("bresenham");

	// preenchimento
	const [fillAlgorithm, setFillAlgorithm] = useState("none");
	const [boolFillAlgorithm, setBoolFillAlgorithm] = useState(false);

	// translação
	const [translateMode, setTranslateMode] = useState(false);
	const [translateX, setTranslateX] = useState(0);
	const [translateY, setTranslateY] = useState(0);

	const [rotateMode, setRotateMode] = useState(false);
	const [rotationAngle, setRotationAngle] = useState(0);
	const [pivotPoint, setPivotPoint] = useState(null);
	const [selectingPivot, setSelectingPivot] = useState(false);

	// ! ======================
	// ! ===== ALGORITMOS =====
	// ! ======================

	const bresenhamLine = (x0, y0, x1, y1) => {
		const points = [];
		let dx = Math.abs(x1 - x0);
		let dy = Math.abs(y1 - y0);
		let sx = x0 < x1 ? 1 : -1;
		let sy = y0 < y1 ? 1 : -1;
		let err = dx - dy;

		while (true) {
			points.push([x0, y0]);
			if (x0 === x1 && y0 === y1) break;
			let e2 = 2 * err;
			if (e2 > -dy) {
				err -= dy;
				x0 += sx;
			}
			if (e2 < dx) {
				err += dx;
				y0 += sy;
			}
		}
		return points;
	};

	const circlePoints = (x0, y0, x1, y1) => {
		const points = [];
		const radius = Math.floor(
			Math.sqrt(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2))
		);
		let x = radius;
		let y = 0;
		let err = 0;

		while (x >= y) { // vai subindo do centro do círculo até o topo
			points.push([x0 + x, y0 + y], [x0 + y, y0 + x]);
			points.push([x0 - y, y0 + x], [x0 - x, y0 + y]);
			points.push([x0 - x, y0 - y], [x0 - y, y0 - x]);
			points.push([x0 + y, y0 - x], [x0 + x, y0 - y]);

			y += 1;
			err += 1 + 2 * y; 
			if (2 * (err - x) + 1 > 0) { //ajustar x para a esquerda
				x -= 1;
				err += 1 - 2 * x;
			}
		}
		return points;
	};


	const ellipsePoints = (x0, y0, x1, y1) => {
		const points = [];
		const rx = Math.abs(x1 - x0);
		const ry = Math.abs(y1 - y0);
		let x = 0;
		let y = ry;

		// Região 1
		let d1 = ry * ry - rx * rx * ry + 0.25 * rx * rx;
		let dx = 2 * ry * ry * x;
		let dy = 2 * rx * rx * y;

		while (dx < dy) {
			points.push([x0 + x, y0 + y], [x0 - x, y0 + y]);
			points.push([x0 + x, y0 - y], [x0 - x, y0 - y]);

			if (d1 < 0) {
				x++;
				dx += 2 * ry * ry;
				d1 += dx + ry * ry;
			} else {
				x++;
				y--;
				dx += 2 * ry * ry;
				dy -= 2 * rx * rx;
				d1 += dx - dy + ry * ry;
			}
		}

		// Região 2
		let d2 =
			ry * ry * ((x + 0.5) * (x + 0.5)) +
			rx * rx * ((y - 1) * (y - 1)) -
			rx * rx * ry * ry;

		while (y >= 0) {
			points.push([x0 + x, y0 + y], [x0 - x, y0 + y]);
			points.push([x0 + x, y0 - y], [x0 - x, y0 - y]);

			if (d2 > 0) {
				y--;
				dy -= 2 * rx * rx;
				d2 += rx * rx - dy;
			} else {
				y--;
				x++;
				dx += 2 * ry * ry;
				dy -= 2 * rx * rx;
				d2 += dx - dy + rx * rx;
			}
		}

		return points;
	};

	const recursiveFill = (grid, x, y, targetColor, fillColor) => {
		if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return; // Fora dos limites
		if (grid[x][y] === targetColor) return; // Não é a cor alvo
		if (grid[x][y] === fillColor) return;

		grid[x][y] = fillColor; // Preenche a cor

		// Chama recursivamente para as células adjacentes
		recursiveFill(grid, x + 1, y, targetColor, fillColor); // Cima
		recursiveFill(grid, x - 1, y, targetColor, fillColor); // Baixo
		recursiveFill(grid, x, y + 1, targetColor, fillColor); // Direita
		recursiveFill(grid, x, y - 1, targetColor, fillColor); // Esquerda
	};

	const translateGrid = () => {
		const dx = parseInt(translateX);
		const dy = parseInt(translateY);

		const newGrid = Array(GRID_SIZE)
			.fill()
			.map(() => Array(GRID_SIZE).fill(null));

		for (let i = 0; i < GRID_SIZE; i++) {
			for (let j = 0; j < GRID_SIZE; j++) {
				if (grid[i][j]) {
					const newI = i - dx;
					const newJ = j + dy;

					if (
						newI >= 0 &&
						newI < GRID_SIZE &&
						newJ >= 0 &&
						newJ < GRID_SIZE
					) {
						newGrid[newI][newJ] = grid[i][j];
					}
				}
			}
		}
		setGrid(newGrid);
	};

	const polylinePoints = (points) => {
		const polylinePoints = [];
		for (let i = 0; i < points.length - 1; i++) {
			const [x0, y0] = points[i];
			const [x1, y1] = points[i + 1];
			polylinePoints.push(...bresenhamLine(x0, y0, x1, y1));
		}
		return polylinePoints;
	};

	const degreesToRadians = (degrees) => {
		return degrees * (Math.PI / 180);
	};

	const rotateGrid = () => {
		if (!pivotPoint) {
			alert("Por favor, selecione um ponto pivot primeiro!");
			return;
		}

		const angle = degreesToRadians(-rotationAngle); // Negativo para rotação horária
		const [pivotX, pivotY] = pivotPoint;

		const newGrid = Array(GRID_SIZE)
			.fill()
			.map(() => Array(GRID_SIZE).fill(null));

		for (let i = 0; i < GRID_SIZE; i++) {
			for (let j = 0; j < GRID_SIZE; j++) {
				if (grid[i][j]) {
					const x = i - pivotX;
					const y = j - pivotY;

					const rotatedX = Math.round(
						x * Math.cos(angle) - y * Math.sin(angle)
					);
					const rotatedY = Math.round(
						x * Math.sin(angle) + y * Math.cos(angle)
					);

					const newI = rotatedX + pivotX;
					const newJ = rotatedY + pivotY;

					if (
						newI >= 0 &&
						newI < GRID_SIZE &&
						newJ >= 0 &&
						newJ < GRID_SIZE
					) {
						newGrid[newI][newJ] = grid[i][j];
					}
				}
			}
		}

		setGrid(newGrid);
		// setRotationAngle(0); // Reseta o ângulo após a rotação
	};

	// ! ======================
	// ! ====== CLIQUES =====
	// ! ======================

	const handleFillAlgorithmClick = () => {
		setFillAlgorithm((prev) =>
			prev === "recursive" ? "none" : "recursive"
		);
		setBoolFillAlgorithm((prev) => !prev); // Alterna o estado booleano
	};

	const handleCellClick = (row, col) => {
		if (rotateMode && selectingPivot) {
			setPivotPoint([row, col]);
			setSelectingPivot(false);
			return;
		}

		if (translateMode || rotateMode) {
			return; // Ignora cliques nas células quando no modo de translação
		}
		if (algorithm === "polyline") {
			if (selectedPoints.length === 0) {
				setSelectedPoints([[row, col]]);
			} else {
				const newPoints = [...selectedPoints, [row, col]];
				const points = polylinePoints(newPoints);
				const newGrid = Array(GRID_SIZE)
					.fill()
					.map(() => Array(GRID_SIZE).fill(null));
				points.forEach(([x, y]) => {
					if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
						newGrid[x][y] = color;
					}
				});
				setGrid(newGrid);
				setSelectedPoints(newPoints);
			}
		} else {
			if (selectedPoints.length === 0) {
				setSelectedPoints([[row, col]]);
			} else if (selectedPoints.length === 1) {
				const [first] = selectedPoints;
				let points;

				switch (algorithm) {
					case "bresenham":
						points = bresenhamLine(first[0], first[1], row, col);
						break;
					case "circle":
						points = circlePoints(first[0], first[1], row, col);
						break;
					case "ellipse":
						points = ellipsePoints(first[0], first[1], row, col);
						break;
					default:
						points = bresenhamLine(first[0], first[1], row, col);
				}

				const newGrid = Array(GRID_SIZE)
					.fill()
					.map(() => Array(GRID_SIZE).fill(null));
				points.forEach(([x, y]) => {
					if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
						newGrid[x][y] = color;
					}
				});
				setGrid(newGrid);
				setSelectedPoints([]);
			}
		}
	};

	const handleFillClick = (row, col) => {
		// if (fillAlgorithm === "recursive") {
		if (grid[row][col] !== "blue") {
			// Verifica se é uma cor válida
			const newGrid = grid.map((r) => r.slice()); // Cria uma cópia da grade
			recursiveFill(newGrid, row, col, "blue", "purple");
			setGrid(newGrid);
		}
		// }
	};

	const handleTranslateClick = () => {
		setTranslateMode(!translateMode);
		// Reseta os valores de translação quando desativa o modo
		if (translateMode) {
			setTranslateX(0);
			setTranslateY(0);
		}
	};

	const handleRotateClick = () => {
		setRotateMode(!rotateMode);
		if (!rotateMode) {
			setTranslateMode(false);
			setBoolFillAlgorithm(false);
			if (!pivotPoint) {
				setSelectingPivot(true);
			}
		} else {
			setSelectingPivot(false);
			setPivotPoint(null);
			setRotationAngle(0);
		}
	};

	const clearGrid = () => {
		setGrid(
			Array(GRID_SIZE)
				.fill()
				.map(() => Array(GRID_SIZE).fill(false))
		);
		setSelectedPoints([]);
	};

	return (
		<div className="flex gap-4 p-4">
			<div className="bg-white rounded-lg shadow-lg p-4">
				<div
					style={{
						display: "grid",
						gridTemplateColumns: `repeat(${GRID_SIZE}, 1.5rem)`,
						gap: "1px",
					}}
				>
					{grid.map((row, i) =>
						row.map((cell, j) => (
							<div
								key={`${i}-${j}`}
								className={`w-6 h-6 border border-gray-300 cursor-pointer ${
									cell === "blue"
										? "bg-blue-500"
										: cell === "purple"
										? "bg-purple-500"
										: selectedPoints.some(
												([x, y]) => x === i && y === j
										  )
										? "bg-green-500"
										: "bg-white"
								}`}
								onClick={() => {
									if (boolFillAlgorithm === false) {
										handleCellClick(i, j);
									} else {
										handleFillClick(i, j); // Preenche a área se o clique for em uma célula válida
									}
								}}
							/>
						))
					)}
				</div>
			</div>

			<div className="flex flex-col gap-2">
				<button
					className={`px-4 py-2 rounded-md ${
						algorithm === "bresenham"
							? "bg-blue-500 text-white"
							: "bg-gray-200 hover:bg-gray-300"
					}`}
					onClick={() => setAlgorithm("bresenham")}
				>
					Linha (Bresenham)
				</button>
				<button
					className={`px-4 py-2 rounded-md ${
						algorithm === "circle"
							? "bg-blue-500 text-white"
							: "bg-gray-200 hover:bg-gray-300"
					}`}
					onClick={() => setAlgorithm("circle")}
				>
					Círculo
				</button>
				<button
					className={`px-4 py-2 rounded-md ${
						algorithm === "ellipse"
							? "bg-blue-500 text-white"
							: "bg-gray-200 hover:bg-gray-300"
					}`}
					onClick={() => setAlgorithm("ellipse")}
				>
					Elipse
				</button>

				<button
					className={`px-4 py-2 rounded-md ${
						algorithm === "polyline"
							? "bg-blue-500 text-white"
							: "bg-gray-200 hover:bg-gray-300"
					}`}
					onClick={() => setAlgorithm("polyline")}
				>
					Polilinhas
				</button>

				<button
					className={`px-4 py-2 rounded-md ${
						fillAlgorithm === "recursive"
							? "bg-purple-500 text-white"
							: "bg-gray-200 hover:bg-gray-300"
					}`}
					onClick={handleFillAlgorithmClick}
				>
					Preeencher Área
				</button>

				<button
					className={`px-4 py-2 rounded-md ${
						translateMode
							? "bg-yellow-500 text-white"
							: "bg-gray-200 hover:bg-gray-300"
					}`}
					onClick={handleTranslateClick}
				>
					Modo Translação
				</button>

				{translateMode && (
					<div className="flex flex-col gap-2 p-2 border rounded">
						<div className="flex flex-col gap-1">
							<label className="text-sm">Deslocamento X:</label>
							<input
								type="number"
								value={translateY}
								onChange={(e) => setTranslateY(e.target.value)}
								className="px-2 py-1 border rounded"
							/>
						</div>
						<div className="flex flex-col gap-1">
							<label className="text-sm">Deslocamento Y:</label>
							<input
								type="number"
								value={translateX}
								onChange={(e) => setTranslateX(e.target.value)}
								className="px-2 py-1 border rounded"
							/>
						</div>
						<button
							className="px-4 py-2 rounded-md bg-green-500 text-white hover:bg-green-600"
							onClick={translateGrid}
						>
							Aplicar Translação
						</button>
					</div>
				)}

				<button
					className={`px-4 py-2 rounded-md ${
						rotateMode
							? "bg-yellow-500 text-white"
							: "bg-gray-200 hover:bg-gray-300"
					}`}
					onClick={handleRotateClick}
				>
					Modo Rotação
				</button>

				{rotateMode && (
					<div className="flex flex-col gap-2 p-2 border rounded">
						{selectingPivot ? (
							<div className="text-sm text-blue-600">
								Clique na grade para selecionar o ponto pivot
							</div>
						) : (
							<>
								<div className="flex flex-col gap-1">
									<label className="text-sm">
										Ângulo de rotação (graus):
									</label>
									<input
										type="number"
										value={rotationAngle}
										onChange={(e) =>
											setRotationAngle(
												Number(e.target.value)
											)
										}
										className="px-2 py-1 border rounded"
									/>
								</div>
								{pivotPoint && (
									<div className="text-sm">
										Ponto pivot: ({pivotPoint[0]},{" "}
										{pivotPoint[1]})
									</div>
								)}
								<button
									className="px-4 py-2 rounded-md bg-green-500 text-white hover:bg-green-600"
									onClick={rotateGrid}
								>
									Aplicar Rotação
								</button>
								<button
									className="px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600"
									onClick={() => {
										setPivotPoint(null);
										setSelectingPivot(true);
									}}
								>
									Escolher Novo Pivot
								</button>
							</>
						)}
					</div>
				)}

				<button
					className="px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-600"
					onClick={clearGrid}
				>
					Limpar Grid
				</button>
			</div>
		</div>
	);
};

export default DrawingGrid;
