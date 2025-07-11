import { API_URL } from "@env";
import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { useCallback } from "react";
import { useForm } from "react-hook-form";

interface CadastroFormData {
    nome: string;
    email: string;
    telefone?: string;
    data_nascimento?: string;
    senha: string;
    confirmarSenha: string;
    avatarUrl: string | null;
}

export function useCadastroViewModel() {
    const { control, handleSubmit, } = useForm<CadastroFormData>({
        defaultValues: {
            nome: "",
            email: "",
            senha: "",
            confirmarSenha: "",
            avatarUrl: null,
        },
    });

    const { mutateAsync: cadastrarUsuario } = useMutation({
        mutationFn: async (data: CadastroFormData) => {
            const response = await fetch(`${API_URL}/sign-up`, {
                method: "POST",
                body: JSON.stringify(data),
                headers: {
                    "Content-Type": "application/json",
                },
            })

            return response.json()
        }
    })

    const handleSubmitCadastro = useCallback(async () => {
        try {
            handleSubmit(async (data) => {
                await cadastrarUsuario(data)
            })()

            router.navigate("/login")
        } catch (error) {
            console.log(error)
        }
    }, [handleSubmit])

    return {
        handleSubmitCadastro,
        control,
    }
}