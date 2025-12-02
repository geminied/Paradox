
import { Container } from "@chakra-ui/react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import UserPage from "./pages/UserPage";
import Header from "./components/Header";
import HomePage from "./pages/HomePage";
import AuthPage from "./pages/AuthPage";
import { useRecoilValue } from "recoil";
import userAtom from "./atoms/userAtom";
import UpdateProfilePage from "./pages/UpdateProfilePage";

function App() {
	const user = useRecoilValue(userAtom);
	const location = useLocation();
	
	// Use wider container for profile page with stats
	const isProfilePage = location.pathname.startsWith('/@') || 
		(location.pathname !== '/' && 
		 location.pathname !== '/auth' && 
		 location.pathname !== '/update' &&
		 !location.pathname.startsWith('/auth'));
	
	const getMaxWidth = () => {
		if (location.pathname === '/update') return '650px';
		if (isProfilePage || location.pathname.match(/^\/[^/]+$/)) return '800px';
		return '620px';
	};
	
	return (
		<Container maxW={getMaxWidth()}>
			<Header />
			<Routes>
				<Route path='/' element={user ? <HomePage /> : <Navigate to='/auth' />} />
				<Route path='/auth' element={!user ? <AuthPage /> : <Navigate to='/' />} />
				<Route path='/update' element={user ? <UpdateProfilePage /> : <Navigate to='/auth' />} />
				<Route path='/:username' element={<UserPage />} />
			</Routes>
		</Container>
	);
}

export default App;
