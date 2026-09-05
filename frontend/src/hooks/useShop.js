import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, apiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export function useBuy(openAuth) {
  const { user, setBalance } = useAuth();
  const navigate = useNavigate();

  const buy = useCallback(
    async (product) => {
      if (!user) {
        toast.info("Inicia sesión para comprar");
        openAuth && openAuth();
        return;
      }
      try {
        const { data } = await api.post(`/wallet/purchase/${product.id}`);
        setBalance(data.balance);
        toast.success(`¡Compraste ${product.name}!`, {
          description: `Nuevo saldo: $${data.balance.toFixed(2)}`,
        });
      } catch (err) {
        const msg = apiError(err.response?.data?.detail);
        if (err.response?.status === 400) {
          toast.error(msg, {
            action: { label: "Cargar saldo", onClick: () => navigate("/cargar-saldo") },
          });
        } else {
          toast.error(msg);
        }
      }
    },
    [user, setBalance, navigate, openAuth]
  );

  return buy;
}

export function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/products");
      setProducts(data);
    } finally {
      setLoading(false);
    }
  }, []);
  return { products, loading, load, setProducts };
}
