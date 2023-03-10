import { Container } from 'react-bootstrap';
import UserLoginPage from '../User/UserLoginPage/UserLoginPage';
import ContactPage from '../Pages/ContactPage/ContactPage';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Menu from '../Menu/Menu';
import UserCategoryList from '../User/UserCategoryList/UserCategoryList';
import UserCategoryPage from '../User/UserCategoryPage/UserCategoryPage';


function Application() {
  return (
    <Container className="mt-4">
    <Menu />

    <BrowserRouter>
      <Routes>
        <Route path="/" element={ <div></div> } />
        <Route path='/contact' element={ <ContactPage /> } />
        <Route path='/auth/user/login' element={ <UserLoginPage /> } />
        <Route path="/categories" element={ <UserCategoryList /> } />
        <Route path="/category/:id" element={ <UserCategoryPage /> } />

      </Routes>
    </BrowserRouter>
  </Container>
  );
}


  export default Application;