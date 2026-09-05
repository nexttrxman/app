import { useCallback, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

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

export function usePurchaseGate(openAuth) {
  const { user } = useAuth();
  const [pending, setPending] = useState(null);

  const request = useCallback(
    (product) => {
      if (!user) {
        toast.info("Inicia sesión para comprar");
        openAuth && openAuth();
        return;
      }
      setPending(product);
    },
    [user, openAuth]
  );

  return { pending, request, close: () => setPending(null) };
}
