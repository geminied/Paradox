import { Box, Container } from "@chakra-ui/react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import UserPage from "./pages/UserPage";
import Header from "./components/Header";
import LeftSidebar from "./components/LeftSidebar";
import HomePage from "./pages/HomePage";
import AuthPage from "./pages/AuthPage";
import CompetitionsPage from "./pages/CompetitionsPage";
import TournamentDetailPage from "./pages/TournamentDetailPage";
import MotionArchivePage from "./pages/MotionArchivePage";
import DebateDetailPage from "./pages/DebateDetailPage";
import SavedDebatesPage from "./pages/SavedDebatesPage";
import RoundsPage from "./pages/RoundsPage";
import DebateRoomPage from "./pages/DebateRoomPage";
import { useRecoilValue } from "recoil";
import userAtom from "./atoms/userAtom";
import UpdateProfilePage from "./pages/UpdateProfilePage";
import { useState } from "react";

function App() {
	const user = useRecoilValue(userAtom);
	const location = useLocation();
	const [categoryFilter, setCategoryFilter] = useState(null);
	const [activeTab, setActiveTab] = useState(0);
	
	// Show left sidebar only on home page
	const showLeftSidebar = user && location.pathname === "/";
	
	return (
		<Box position="relative">
			{/* Left Sidebar - fixed position on the left side */}
			{showLeftSidebar && (
				<Box
					position="fixed"
					top="80px"
					right="calc(50% + 360px)"
					display={{ base: "none", xl: "block" }}
					maxH="calc(100vh - 100px)"
					overflowY="auto"
					pb={6}
					css={{
						'&::-webkit-scrollbar': {
							width: '4px',
						},
						'&::-webkit-scrollbar-track': {
							background: 'transparent',
						},
						'&::-webkit-scrollbar-thumb': {
							background: 'transparent',
							borderRadius: '4px',
							transition: 'background 0.2s',
						},
						'&:hover::-webkit-scrollbar-thumb': {
							background: '#444',
						},
						'&::-webkit-scrollbar-thumb:hover': {
							background: '#555',
						},
					}}
				>
					<LeftSidebar />
				</Box>
			)}

			{/* Main Content Container - always centered */}
			<Container maxW="680px" px={4}>
				<Header activeTab={activeTab} onTabChange={setActiveTab} />
				<Routes>
					<Route path='/' element={user ? <HomePage categoryFilter={categoryFilter} setCategoryFilter={setCategoryFilter} activeTab={activeTab} /> : <Navigate to='/auth' />} />
					<Route path='/auth' element={!user ? <AuthPage /> : <Navigate to='/' />} />
					<Route path='/update' element={user ? <UpdateProfilePage /> : <Navigate to='/auth' />} />
					<Route path='/competitions' element={user ? <CompetitionsPage /> : <Navigate to='/auth' />} />
					<Route path='/tournament/:tournamentId' element={user ? <TournamentDetailPage /> : <Navigate to='/auth' />} />
					<Route path='/tournament/:tournamentId/rounds' element={user ? <RoundsPage /> : <Navigate to='/auth' />} />
					<Route path='/debate-room/:debateId' element={user ? <DebateRoomPage /> : <Navigate to='/auth' />} />
					<Route path='/motions/archive' element={<MotionArchivePage />} />
					<Route path='/saved' element={user ? <SavedDebatesPage /> : <Navigate to='/auth' />} />
					<Route path='/debate/:debateId' element={user ? <DebateDetailPage /> : <Navigate to='/auth' />} />
					<Route path='/:username' element={<UserPage />} />
				</Routes>
			</Container>
		</Box>
	);
}

export default App;