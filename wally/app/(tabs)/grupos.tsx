import {
  View,
  StyleSheet,
  Image,
  SafeAreaView,
  FlatList,
  Text,
  Pressable,
  TouchableOpacity,
  Alert, 
} from 'react-native';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Stack } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useGruposViewModel } from '@/viewModels/useGruposViewModel';

export default function TabTwoScreen() {

  const router = useRouter();

  const { grupos, handleDeleteGrupo } = useGruposViewModel({})

  const [openMembersPopover, setOpenMembersPopover] = useState(false)

  const onDeleteGrupo = async (grupoId) => {
    try {
      await handleDeleteGrupo(grupoId);
      Alert.alert("Removido", "Grupo excluído!");
    } catch (error) {
      Alert.alert("Erro", "Não foi possível excluir o grupo");
    }
  }

  return (
    <SafeAreaView style={styles.container}>

      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: '',
          headerBackVisible: false,
          headerStyle: { backgroundColor: '#9ACBD0' },
        }} />

      <View style={styles.logoContainer}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain" />
      </View>

      {grupos && grupos.length > 0 ? (
        <FlatList
          data={grupos}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push({
              pathname: '/grupo',
              params: {
                id: item.id,
              }
            })}>
              <View style={styles.item}>
                <Text style={styles.itemTexto}>{item.nome}</Text>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => onDeleteGrupo(item.id)} 
                  accessible={true}
                  accessibilityHint="Toque para excluir este grupo"
                >
                  <MaterialIcons name="delete" size={22} color="#84B3B6" />
                </TouchableOpacity>
              </View>
            </Pressable>
          )}
          showsVerticalScrollIndicator={true}
        />
      ) : (
        <View style={styles.emptyGroupsContainer}>
          <MaterialIcons name="group" size={64} color="#ccc" />
          <Text style={styles.emptyGroupsText}>Nenhum grupo criado</Text>
          <Text style={styles.emptyGroupsSubtext}>Toque em "Criar Grupo" para começar a dividir despesas com seus amigos</Text>
        </View>
      )}

      <View style={styles.containerBotao}>
        <Pressable
          style={styles.botaoCriarGrupo}
          onPress={() => router.push('/criar-grupo')}
          accessible={true}
          accessibilityLabel="Criar grupo"
          accessibilityHint="Toque para criar um novo grupo"
          accessibilityRole="button">
          <MaterialIcons name="group-add" size={28} color="#fff" />
          <Text style={styles.textoBotao}>CRIAR GRUPO</Text>
        </Pressable>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F2F2',
  },
  logoContainer: {
    alignSelf: 'center',
    top: 36,
    zIndex: 2,
    marginBottom: 66,
  },
  logo: {
    width: 76,
    height: 76,
  },
  titulo: {
    fontFamily: 'Poppins_300Light',
    fontSize: 18,
    color: '#000',
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    marginTop: 66,
  },
  item: {
    width: '90%',
    alignSelf: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderWidth: 1,
    borderColor: '#9ACBD0',
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemTexto: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#000',
  },
  containerBotao: {
    alignItems: 'center',
    padding: 30,
    zIndex: 3,
    marginTop: 16,
  },
  botaoCriarGrupo: {
    width: 330,
    height: 52,
    backgroundColor: '#48A6A7',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoBotao: {
    color: "#fff",
    textAlign: "center",
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    marginLeft: 10,
  },
  deleteButton: {
    padding: 4,
  },
  emptyGroupsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 30,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginHorizontal: 20,
  },
  emptyGroupsText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    marginTop: 8,
  },
  emptyGroupsSubtext: {
    fontFamily: 'Poppins_300Light',
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
});