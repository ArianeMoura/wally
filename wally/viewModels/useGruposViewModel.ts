import { useAuthStore } from "@/store/authStore"
import { API_URL } from "@env"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { router } from "expo-router"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useCallback, useState } from "react"
import { useForm } from "react-hook-form"
import { Keyboard, Platform } from "react-native"

interface Grupo {
    id: string
    nome: string
    descricao: string
    avatar_url: string | null
    usuario_id: string
    data_criacao: string
    data_atualizacao: string | null
    data_exclusao: string | null
}

interface GrupoForm {
    nome: string
    descricao: string
    avatar_url: string | null
    usuario_id: string
    membros: string[]
}

export function useGruposViewModel({ id }: { id?: string }) {
    const queryClient = useQueryClient()

    const token = useAuthStore((state) => state.token)
    const usuario = useAuthStore((state) => state.user)

    const { data: grupos = [], isPending: isLoadingGrupos, refetch: refetchGrupos } = useQuery<Grupo[]>({
        queryKey: ['grupos', usuario?.id],
        queryFn: async () => {
            const response = await fetch(`${API_URL}/grupos?usuario_id=${usuario?.id}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            })
            return response.json()
        },
        enabled: !!token && !!usuario,
        gcTime: 0,
        staleTime: 0,
    })

    const grupoForm = useForm<GrupoForm>({
        defaultValues: {
            nome: '',
            descricao: '',
            avatar_url: null,
            usuario_id: usuario ? usuario.id : '',
            membros: usuario ? [usuario.id] : [],
        }
    })

    const { mutateAsync: criarGrupo } = useMutation({
        mutationFn: async (grupo: GrupoForm) => {
            const response = await fetch(`${API_URL}/grupos`, {
                method: 'POST',
                body: JSON.stringify(grupo),
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            })

            const responseData = await response.json()


            return responseData.grupo
        },
    })


    const handleSubmitGrupo = useCallback(async () => {

        grupoForm.handleSubmit(async (data) => {
            const novoGrupo = await criarGrupo(data)

            await queryClient.invalidateQueries({ queryKey: ['grupos', usuario?.id] })

            grupoForm.reset()

            console.log({ novoGrupo })

            router.navigate({ pathname: '/grupo', params: { id: novoGrupo.id } })
        })()

    }, [criarGrupo, grupoForm, refetchGrupos])


    const { data: statusGrupo, isPending: isLoadingStatusGrupo, refetch: refetchStatusGrupo } = useQuery<IResponse>({
        queryKey: ['statusGrupo', id],
        queryFn: async () => {
            console.log({ url: `/status/grupo?grupo_id=${id}&usuario_id=${usuario?.id}` })
            const response = await fetch(`${API_URL}/status/grupo?grupo_id=${id}&usuario_id=${usuario?.id}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            })
            return response.json()
        },
        enabled: !!id && !!token && !!usuario,
        gcTime: 0,
        staleTime: 0,
    })

    const { mutateAsync: criarDespesa } = useMutation({
        mutationFn: async (despesa: any) => {
            console.log({ url: `${API_URL}/despesas-grupo`, despesa })
            const response = await fetch(`${API_URL}/despesas-grupo`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(despesa)
            })

            if (!response.ok) {
                throw new Error('Erro ao criar despesa')
            }
        }
    })


    const despesaGrupoForm = useForm<any>({
        defaultValues: {
            valor: '',
            data: new Date(),
            nome: '',
            usuario_id: usuario?.id,
            membros_participantes: statusGrupo?.data?.membros.map(membro => ({ ...membro.user, active: false })),
            grupo_id: id,
        }
    })


    const handleSubmitDespesaGrupo = useCallback(despesaGrupoForm.handleSubmit(async (data) => {
        try {
            if (usuario && id) {
                console.log(data)
                //await criarDespesa(data)

                const usuarioId = usuario.id

                await criarDespesa({
                    nome: data.nome,
                    valor: Number(data.valor),
                    usuario_id: data.usuario_id,
                    grupo_id: data.grupo_id,
                    data: data.data,
                    membros_participantes: data.membros_participantes.map(user => user.id)
                })

                await refetchStatusGrupo()

                router.back()
            }
        } catch (error) {
            console.log(error)
        }
    }), [criarDespesa])

    const handleDeleteGrupo = useCallback(async (id: string) => {
        const response = await fetch(`${API_URL}/grupos/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            }
        })

        if (!response.ok) {
            console.log(response)
            throw new Error('Erro ao deletar grupo')
        }

        await refetchGrupos()
    }, [])

    const [showPicker, setShowPicker] = useState(false);
    const [transactionDate, setTransactionDate] = useState(new Date());

    const handleDateChange = useCallback(
        ({ type }: any, selectedDate?: Date) => {
            console.log({ type, selectedDate });
            if (type === "set" && selectedDate) {
                // if (isFuture(selectedDate)) {
                //     Alert.alert("Data inválida", "Não é possível adicionar transações com datas futuras.", [{ text: "OK" }])
                //     return
                // }

                setTransactionDate(selectedDate);

                if (Platform.OS === "android") {
                    setShowPicker(false);
                }
            } else {
                setShowPicker(false);
            }
        },
        [],
    );

    const toggleDataPicker = () => {
        Keyboard.dismiss();
        setShowPicker(!showPicker);
    };

    const formatDateForDisplay = (date: Date) => {
        return format(date, "dd/MM/yyyy", { locale: ptBR });
    };

    return {
        grupos,
        grupoForm,
        handleSubmitGrupo,
        refetchGrupos,
        isLoadingGrupos,
        statusGrupo,
        refetchStatusGrupo,
        despesaGrupoForm,
        handleSubmitDespesaGrupo,
        usuario,
        handleDeleteGrupo,
        showPicker,
        setShowPicker,
        transactionDate,
        setTransactionDate,
        handleDateChange,
        toggleDataPicker,
        formatDateForDisplay,
    }
}
