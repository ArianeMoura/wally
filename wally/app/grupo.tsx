import {
  View,
  StyleSheet,
  Text,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Pressable,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useMemo } from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useQuery } from '@tanstack/react-query';
import { API_URL } from '@env';
import { useAuthStore } from '@/store/authStore';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useGruposViewModel } from '@/viewModels/useGruposViewModel';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';


interface Transacao {
  nome: string
  usuario_id: string
  valor_total: number
  valor_pego_emprestado: number | null
  data: Date
  envolvido: boolean
  emprestou: boolean
}

interface GetGrupoBalancoUseCaseResponse {
  nome: string
  transacoes: Transacao[]
}

interface IResponse {
  success: boolean
  data: GetGrupoBalancoUseCaseResponse | null
  error: any | null
}

export default function GrupoScreen() {
  const { id } = useLocalSearchParams()

  const router = useRouter();

  const { statusGrupo, usuario } = useGruposViewModel({ id: id as string })

  console.log({ id })

  console.log({ statusGrupo: statusGrupo })

  // const saldoDevedor = useMemo(() => {
  //   return statusGrupo?.data?.transacoes.reduce((acc, current) => acc.)
  // }, [])

  return (
    <>
      <SafeAreaView style={styles.container}>

        <StatusBar backgroundColor="#9ACBD0" barStyle="light-content" />

        <View style={styles.botaoVoltar}>

          <Pressable
            onPress={() => router.push('/(tabs)/grupos')}>
            <MaterialIcons name="arrow-back-ios" size={24} color="#006A71" />
          </Pressable>

        </View>

        <View style={styles.mainContent}>

          <Text style={styles.titulo}>{statusGrupo?.data?.nome}</Text>

          <Text style={styles.subTitulo}>Você deve {((statusGrupo?.data?.usuario.deve ?? 0) as number).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Text>

          <View>
            <Text style={styles.subTituloMembros}>Membros:</Text>
            <FlatList
              data={statusGrupo?.data?.membros}
              renderItem={({ item }) => (
                <View>
                  <Text style={styles.nomeMembros}>{item.user.nome}</Text>
                </View>
              )}
              showsVerticalScrollIndicator={false}
            />
          </View>

          <View style={styles.containerBotoes}>
            <TouchableOpacity
              style={styles.botaoQuitar}
              onPress={() => ("")}
              accessible={true}
              accessibilityLabel="Adicionar Despesa"
              accessibilityHint="Toque para adicionar uma nova despesa no grupo"
              activeOpacity={0.7}
            >
              <View style={styles.botaoIconeContainer}>
                <Ionicons name="close-circle-outline" size={24} color="#006A71" />
              </View>
              <Text style={styles.textoBotaoQuitar}>QUITAR CONTAS</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botaoAdicionar}
              onPress={() => router.push({ pathname: '/add-despesa', params: { grupoId: id } })}
              accessible={true}
              accessibilityLabel="Adicionar Despesa"
              accessibilityHint="Toque para adicionar uma nova despesa no grupo"
              activeOpacity={0.7}
            >
              <View style={styles.botaoIconeContainer}>
                <MaterialIcons name="add" size={20} color="#fff" />
              </View>
              <Text style={styles.textoBotao}>ADICIONAR DESPESA</Text>
            </TouchableOpacity>
          </View>

          {statusGrupo?.data?.transacoes && statusGrupo.data.transacoes.length > 0 ? (
            <FlatList
              data={statusGrupo?.data?.transacoes}
              renderItem={({ item }) => (
                <View style={styles.item}>
                  <Text style={styles.itemTexto}>{format(new Date(item.data), 'MMMM dd, yyyy', { locale: ptBR }).replace(/^\w/, (c) => c.toUpperCase())}</Text>
                  <Text style={styles.itemTexto}>{item.nome}</Text>
                  {item.emprestou && (
                    <Text style={styles.itemTextoValor}>Você pagou {(item.valor_total as number).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Text>
                  )}

                  {!item.emprestou && item.envolvido && (
                    <Text style={styles.itemTextoValor}>Você pegou {(item.valor_pego_emprestado ?? 0 as number).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} emprestado</Text>
                  )}

                  {!item.envolvido && !item.emprestou && (
                    <Text style={styles.itemTextoValor}>{`${item.usuario_nome} pagou ${(item.valor_total as number).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} - Não envolvido`}</Text>
                  )}
                </View>
              )}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyExpensesContainer}>
              <MaterialIcons name="receipt-long" size={48} color="#ccc" />
              <Text style={styles.emptyExpensesText}>Nenhuma despesa adicionada</Text>
              <Text style={styles.emptyExpensesSubtext}>Toque em "Adicionar Despesa" para criar a primeira despesa do grupo</Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F2F2',
  },
  botaoVoltar: {
    position: 'absolute',
    left: 8,
    padding: 16,
  },
  mainContent: {
    flex: 1,
    paddingTop: 80,
    paddingBottom: 60,
    paddingHorizontal: 30,
  },
  titulo: {
    fontFamily: 'Poppins_300Light',
    fontSize: 20,
    color: '#000',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    marginTop: 36,
  },
  subTitulo: {
    fontFamily: 'Poppins_300Light',
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    marginTop: 26,
  },
  subTituloMembros: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    color: '#006A71',
    textAlign: 'center',
    marginTop: 26,
  },
  nomeMembros: {
    fontFamily: 'Poppins_300Light',
    fontSize: 14,
    color: '#444',
    textAlign: 'center',
  },
  tituloLista: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: '#777',
    textAlign: 'left',
    marginBottom: 6,
    marginTop: 6,
    padding: 8,
  },
  item: {
    backgroundColor: '#FFF',
    marginBottom: 8,
    borderRadius: 8,
    borderColor: '#9ACBD0',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  itemTexto: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#666',
    padding: 8,
    marginLeft: 8,
  },
  itemTextoValor: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#333',
    padding: 8,
    paddingBottom: 10,
    marginLeft: 8,
  },
  containerBotoes: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 26,
    marginTop: 36,
  },
  botaoAdicionar: {
    backgroundColor: "#48A6A7",
    borderRadius: 8,
    padding: 6,
    alignItems: "center",
    justifyContent: "center",
    height: 60,
    width: "48%",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  botaoQuitar: {
    backgroundColor: "#ffff",
    borderRadius: 8,
    padding: 6,
    alignItems: "center",
    justifyContent: "center",
    height: 60,
    width: "48%",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  botaoIconeContainer: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  textoBotao: {
    fontFamily: "Poppins_300Light",
    fontSize: 14,
    color: "#ffff",
  },
  textoBotaoQuitar: {
    fontFamily: "Poppins_300Light",
    fontSize: 14,
    color: "#006A71",
  },
  emptyExpensesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  emptyExpensesText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    marginTop: 16,
  },
  emptyExpensesSubtext: {
    fontFamily: 'Poppins_300Light',
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
})