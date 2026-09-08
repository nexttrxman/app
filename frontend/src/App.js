import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Home from "@/pages/Home";
import Products from "@/pages/Products";
import Account from "@/pages/Account";
import TopUp from "@/pages/TopUp";
import Admin from "@/pages/Admin";
import Referrals from "@/pages/Referrals";
import SliderDemo from "@/pages/SliderDemo";

function App() {
  return (
    <div className="App">
    <h1 style={{ color: "#0f0", position: "fixed", top: 60, left: 10, zIndex: 99999 }}>
        APP RENDER OK
      </h1>
      <AuthProvider>
        <BrowserRouter>
          <Header />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/productos" element={<Products />} />
            <Route path="/mi-cuenta" element={<Account />} />
            <Route path="/cargar-saldo" element={<TopUp />} />
            <Route path="/referidos" element={<Referrals />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/slider-demo" element={<SliderDemo />} />
          </Routes>
          <Footer />
        </BrowserRouter>
        <Toaster position="top-right" theme="dark" richColors />
      </AuthProvider>
    </div>
  );
}

export default App;
