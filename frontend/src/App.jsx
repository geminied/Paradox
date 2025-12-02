import { Box, Container, Flex } from "@chakra-ui/react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import UserPage from "./pages/UserPage";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import HomePage from "./pages/HomePage";
import AuthPage from "./pages/AuthPage";
import CompetitionsPage from "./pages/CompetitionsPage";
import DebateDetailPage from "./pages/DebateDetailPage";
import { useRecoilValue, useRecoilState } from "recoil";
import userAtom from "./atoms/userAtom";
import UpdateProfilePage from "./pages/UpdateProfilePage";
import { useState } from "react";

function App() {
	const user = useRecoilValue(userAtom);
	const location = useLocation();
	const [categoryFilter, setCategoryFilter] = useState(null);
	
	// Show sidebar only on home page
	const showSidebar = user && location.pathname === "/";
	
	return (
		<Box position="relative">
			{/* Main Content Container - always centered */}
			<Container maxW="620px">
				<Header />
				<Routes>
					<Route path='/' element={user ? <HomePage categoryFilter={categoryFilter} setCategoryFilter={setCategoryFilter} /> : <Navigate to='/auth' />} />
					<Route path='/auth' element={!user ? <AuthPage /> : <Navigate to='/' />} />
					<Route path='/update' element={user ? <UpdateProfilePage /> : <Navigate to='/auth' />} />
					<Route path='/competitions' element={user ? <CompetitionsPage /> : <Navigate to='/auth' />} />
					<Route path='/debate/:debateId' element={user ? <DebateDetailPage /> : <Navigate to='/auth' />} />
					<Route path='/:username' element={<UserPage />} />
				</Routes>
			</Container>

			{/* Sidebar - fixed position on the right side */}
			{showSidebar && (
				<Box
					position="fixed"
					top="80px"
					left="calc(50% + 340px)"
					display={{ base: "none", xl: "block" }}
				>
					<Sidebar 
						onCategoryFilter={setCategoryFilter} 
						activeCategory={categoryFilter}
					/>
				</Box>
			)}
		</Box>
	);
}

export default App;