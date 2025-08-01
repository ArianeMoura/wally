import {
  View,
  StyleSheet,
  Text,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Pressable,
  FlatList,
} from 'react-native';
import { Dialog, Button, TextInput as TextInputPaper } from "react-native-paper"
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback } from 'react';
import { QueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { API_URL } from '@env';
import { useAuthStore } from '@/store/authStore';
import { Controller, useForm } from 'react-hook-form';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useGruposViewModel } from '@/viewModels/useGruposViewModel';
import { TransactionDatePicker } from '@/components/TransactionDatePicker';
interface Despesa {
  valor: string;
  data: string;
  nome: string;
}

export default function AdicionarDespesaGrupo() {
  const { grupoId } = useLocalSearchParams()

  console.log({ grupoId })

  const { 
    statusGrupo, 
    despesaGrupoForm, 
    handleSubmitDespesaGrupo, 
    refetchStatusGrupo, 
    showPicker, 
    setShowPicker, 
    handleDateChange, 
    toggleDataPicker, 
    formatDateForDisplay, 
    transactionDate,
  } = useGruposViewModel({ id: String(grupoId) })

  const handleSelectMember = useCallback(
    (u: any, membrosParticipantes: any[], onChange: (updated: any[]) => void) => {
      const index = membrosParticipantes.findIndex((usuario) => usuario.id === u.id);

      console.log({ index })
      if (index >= 0) {
        const updated = membrosParticipantes.map((m, i) =>
          i === index ? { ...m, active: !m.active } : m
        );
        onChange(updated);
      } else {
        const newValues = [...membrosParticipantes, { ...u, active: true }];
        onChange(newValues);
      }
    },
    []
  );

  return (
    <>

      <SafeAreaView style={styles.container}>

        <StatusBar backgroundColor="#9ACBD0" barStyle="light-content" />

        <View style={styles.botaoVoltar}>

          <Pressable
            onPress={() => router.push({
              pathname: '/grupo',
              params: {
                id: grupoId,
              }
            })}>
            <MaterialIcons name="arrow-back-ios" size={24} color="#006A71" />
          </Pressable>

        </View>

        <View style={styles.mainContent}>

          <Text style={styles.titulo}>{statusGrupo.data.nome}</Text>

          {/* <Text style={styles.tituloDois}>Você pagou:</Text> */}

          <Text style={styles.labelNome}>Nome da Despesa</Text>
          <Controller
            control={despesaGrupoForm.control}
            name="nome"
            render={({ field }) => (
              <TextInput
                style={styles.input}
                placeholder="Nome da Despesa"
                value={field.value}
                onChangeText={field.onChange}
              />
            )}
          />

          <Text style={styles.labelNome}>Valor</Text>
          <Controller
            control={despesaGrupoForm.control}
            name="valor"
            render={({ field }) => (
              <TextInput
                style={styles.input}
                placeholder="Valor"
                value={field.value.toString()}
                onChangeText={field.onChange}
              />
            )}
          />

          <Text style={styles.labelNome}>Data</Text>
          <Pressable onPress={toggleDataPicker} style={styles.datePickerButton}>
            <Controller
              control={despesaGrupoForm.control}
              name="data"
              render={({ field }) => (
                <TextInputPaper
                  value={formatDateForDisplay(field.value)}
                  editable={false}
                  style={styles.dialogInput}
                  mode="outlined"
                  outlineColor="#DADADA"
                  activeOutlineColor="#A6A6A6"
                  right={<TextInputPaper.Icon icon="calendar" onPress={toggleDataPicker} />}
                  accessible={true}
                  accessibilityLabel={`Data: ${formatDateForDisplay(field.value)}`}
                  accessibilityHint="Toque para selecionar uma data"
                />
              )}
            />
          </Pressable>

          <Controller
            control={despesaGrupoForm.control}
            name="data"
            render={({ field }) => (
              <TransactionDatePicker
                visible={showPicker}
                onClose={() => setShowPicker(false)}
                date={field.value}
                onChange={(set, date) => {
                  handleDateChange(set, date)

                  field.onChange(date)
                }}
              />
            )}
          />

          <View>
            <Text style={styles.labelDivisao}>Dividir entre:</Text>

            <Controller
              control={despesaGrupoForm.control}
              name="membros_participantes"
              render={({ field }) => (
                <FlatList
                  data={field.value}
                  keyExtractor={item => item.id}
                  renderItem={({ item }) => {
                    //console.log({ item })
                    return (
                      <Pressable onPress={() => handleSelectMember(item, field.value, field.onChange)}>
                        <View >
                          <Text style={{ opacity: item.active ? 1 : 0.25 }}>{item.nome}</Text>
                        </View>
                      </Pressable>
                    )
                  }
                  }
                  showsVerticalScrollIndicator={true}
                />
              )}
            />
          </View>

          <TouchableOpacity
            style={styles.botaoSalvar}
            accessible={true}
            accessibilityLabel="Salvar"
            accessibilityHint="Toque para salvar despesa"
            accessibilityRole="button"
            onPress={handleSubmitDespesaGrupo}>
            <Text style={styles.textoBotao}>SALVAR</Text>
          </TouchableOpacity>

        </View>
      </SafeAreaView >
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
    paddingHorizontal: 20,
    margin: 8,
  },
  titulo: {
    fontFamily: 'Poppins_300Light',
    fontSize: 20,
    color: '#000',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    marginTop: 56,
  },
  tituloDois: {
    fontFamily: 'Poppins_300Light',
    textAlign: 'center',
    fontSize: 16,
    color: '#777',
    marginTop: 26,
  },
  input: {
    height: 60,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 14,
    backgroundColor: "#fff",
    fontFamily: "Inter",
  },
  labelNome: {
    fontFamily: "Poppins_300Light",
    padding: 8,
    fontSize: 14,
    color: "#777",
    marginBottom: 6,
    marginTop: 6,
  },
  labelDivisao: {
    fontFamily: "Poppins_300Light",
    padding: 8,
    fontSize: 14,
    color: "#777",
    marginBottom: 26,
    marginTop: 6,
  },
  botaoSalvar: {
    width: 330,
    height: 52,
    marginTop: 76,
    backgroundColor: '#006A71',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 3.6,
  },
  textoBotao: {
    color: "#fff",
    textAlign: "center",
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
  },
  datePickerButton: {
    flex: 1,
    marginLeft: 8,
  },
  dialogInput: {
    flex: 1,
    backgroundColor: "#fff",
    marginBottom: 16,
  },
});