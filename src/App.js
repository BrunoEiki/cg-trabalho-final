import React, { useState } from "react";

const GRID_SIZE = 21;

const DrawingGrid = () => {
	const [grid, setGrid] = useState(
		Array(GRID_SIZE)
			.fill()
			.map(() => Array(GRID_SIZE).fill(false))
	);
	const [selectedPoints, setSelectedPoints] = useState([]);
	const [color, setColor] = useState("blue"); // Cor padrão
	const [algorithm, setAlgorithm] = useState("bresenham");
	const [fillAlgorithm, setFillAlgorithm] = useState("none");
	const [boolFillAlgorithm, setBoolFillAlgorithm] = useState(false);

	// Implementação do algoritmo de Bresenham
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

	// Implementação do algoritmo de círculo
	const circlePoints = (x0, y0, x1, y1) => {
		const points = [];
		const radius = Math.floor(
			Math.sqrt(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2))
		);
		let x = radius;
		let y = 0;
		let err = 0;

		while (x >= y) {
			points.push([x0 + x, y0 + y], [x0 + y, y0 + x]);
			points.push([x0 - y, y0 + x], [x0 - x, y0 + y]);
			points.push([x0 - x, y0 - y], [x0 - y, y0 - x]);
			points.push([x0 + y, y0 - x], [x0 + x, y0 - y]);

			y += 1;
			err += 1 + 2 * y;
			if (2 * (err - x) + 1 > 0) {
				x -= 1;
				err += 1 - 2 * x;
			}
		}
		return points;
	};

	// Função auxiliar para curva de Bezier
	const bezierPoint = (t, p0, p1, p2) => {
		const mt = 1 - t;
		return Math.round(mt * mt * p0 + 2 * mt * t * p1 + t * t * p2);
	};

	// Implementação da curva de Bezier quadrática
	const bezierCurve = (x0, y0, x1, y1) => {
		const points = [];
		const midX = (x0 + x1) / 2;
		const controlY = Math.min(y0, y1) - 5;

		for (let t = 0; t <= 1; t += 0.01) {
			const x = bezierPoint(t, x0, midX, x1);
			const y = bezierPoint(t, y0, controlY, y1);
			points.push([Math.round(x), Math.round(y)]);
		}
		return points;
	};

	// Implementação do algoritmo de elipse
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

	const handleFillAlgorithmClick = () => {
		setFillAlgorithm((prev) =>
			prev === "recursive" ? "none" : "recursive"
		);
		setBoolFillAlgorithm((prev) => !prev); // Alterna o estado booleano
	};

	const handleCellClick = (row, col) => {
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
				case "bezier":
					points = bezierCurve(first[0], first[1], row, col);
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
	};

	const handleFillClick = (row, col) => {
		// if (fillAlgorithm === "recursive") {
			console.log("ASSSSSSSSSSSSSA");
			if (grid[row][col] !== "blue") {
				// Verifica se é uma cor válida
				const newGrid = grid.map((r) => r.slice()); // Cria uma cópia da grade
				recursiveFill(newGrid, row, col, "blue", "purple");
				setGrid(newGrid);
			}
		// }
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
						algorithm === "bezier"
							? "bg-blue-500 text-white"
							: "bg-gray-200 hover:bg-gray-300"
					}`}
					onClick={() => setAlgorithm("bezier")}
				>
					Curva Bezier
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
						fillAlgorithm === "recursive"
							? "bg-purple-500 text-white"
							: "bg-gray-200 hover:bg-gray-300"
					}`}
					onClick={handleFillAlgorithmClick}
					
				>
					Preeencher Área
				</button>

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
