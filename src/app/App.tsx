import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from '../home';
import { GamePage } from '../game';
import { LocalFileLoader } from '../localfile/LocalFileLoader';

export const App = () => {
  return (
    <>
      <LocalFileLoader />
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<HomePage />} />
          <Route path='/play' element={<GamePage />} />
        </Routes>
      </BrowserRouter>
    </>
  );
};
