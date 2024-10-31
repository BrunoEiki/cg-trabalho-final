import React, { useState } from "react";

import NavBar from "./components/NavBar";
import { Routes, Route } from "react-router-dom";

import ImageProcessing from "./pages/ImageProcessor";
import ImageSynthesis from "./pages/ImageSynthesis";

function App() {
	return (
		<div className="flex gap-4 p-4">
			<NavBar />
			<Routes>
				<Route path="/image-processing" element={<ImageProcessing />} />
				<Route path="/image-synthesis" element={<ImageSynthesis />} />
			</Routes>
		</div>
	);
}

export default App;