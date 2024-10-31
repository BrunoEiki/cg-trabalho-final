// component/NavBar.js

import { NavLink } from "react-router-dom";

const NavBar = () => {
	return (
		<nav>
			<ul>
				<li>
					<NavLink className="hover:underline" to="/">
						Home
					</NavLink>
				</li>
				<li>
					<NavLink className="hover:underline" to="/image-processing">
						Image Processing
					</NavLink>
				</li>
				<li>
					<NavLink className="hover:underline" to="/image-synthesis">
						Image Sythesis
					</NavLink>
				</li>
			</ul>
		</nav>
	);
};

export default NavBar;
