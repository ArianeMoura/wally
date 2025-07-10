import { View, StyleSheet, StatusBar, Text, SafeAreaView, TextInput, Pressable, FlatList, TouchableOpacity, ScrollView, Dimensions } from "react-native"
import { useCallback, useMemo, useState } from "react"
import Ionicons from "@expo/vector-icons/Ionicons"
import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import { useGruposViewModel } from "@/viewModels/useGruposViewModel"
import { Controller } from "react-hook-form"
import { router } from "expo-router"
import Popover from '@/components/popover';
import HBox from '@/components/containers/h-box';
import { useQuery } from "@tanstack/react-query"
import { API_URL } from "@env"
import { useAuthStore } from "@/store/authStore"

const { width: screenWidth } = Dimensions.get('window');

export default function CriarGrupoScreen() {
  const [tipoSelecionado, setTipoSelecionado] = useState<string | null>(null)

  const tiposGrupo = [
    { id: "viagem", icon: "airplane-outline", label: "Viagem", component: Ionicons },
    { id: "casa", icon: "home-outline", label: "Casa", component: Ionicons },
    { id: "trabalho", icon: "briefcase-outline", label: "Trabalho", component: Ionicons },
    { id: "outro", icon: "list-outline", label: "Outro", component: Ionicons },
  ]

  const { grupoForm, handleSubmitGrupo } = useGruposViewModel({})

  const handleSearchDebounce = useCallback((value: string) => {
    if (searchText && searchText.length >= 3) {
      setSearchText(value)
      return
    }
    setSearchText(value)
  }, [])

  const [openMembersPopover, setOpenMembersPopover] = useState(false)

  const token = useAuthStore((state) => state.token)
  const usuario = useAuthStore((state) => state.user)

  const { data: usuarios = [], error } = useQuery({
    queryKey: ['usuarios'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/usuarios`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      return data
    },
    enabled: true
  })

  const [selectedMembros, setSelectedMembros] = useState<{ id: string, nome: string, email: string }[]>([])
  const [searchText, setSearchText] = useState<string | null>(null)

  const membersFiltered = useMemo(() => {
    if (searchText) {
      return usuarios.filter(usuario => 
        usuario.email.toLowerCase().includes(searchText.toLowerCase()) || 
        usuario.nome.toLowerCase().includes(searchText.toLowerCase())
      )
    }
    return []
  }, [searchText, usuarios])

  const handleSelectMember = useCallback((u: { id: string; nome: string; email: string }) => {
    if (!usuario) return
    
    setSelectedMembros((prev) => {
      const index = prev.findIndex((usuario) => usuario.id === u.id);

      if (index >= 0) {
        const newValues = [...prev.slice(0, index), ...prev.slice(index + 1)]
        grupoForm.setValue('membros', [...newValues.map(usuario => usuario.id), usuario.id])
        return newValues;
      } else {
        const newValues = [...prev, u]
        grupoForm.setValue('membros', [...newValues.map(usuario => usuario.id), usuario.id])
        return newValues;
      }
    });

    setSearchText(null)
  }, [usuario, grupoForm]);

  const renderMemberItem = ({ item }: { item: { id: string; nome: string; email: string } }) => (
    <TouchableOpacity 
      style={styles.memberItem} 
      onPress={() => handleSelectMember(item)}
      activeOpacity={0.7}
    >
      <View style={styles.memberInfo}>
        <Text style={styles.memberName} numberOfLines={1}>{item.nome}</Text>
        <Text style={styles.memberEmail} numberOfLines={1}>{item.email}</Text>
      </View>
      <MaterialIcons name="remove-circle-outline" size={24} color="#FF6B6B" />
    </TouchableOpacity>
  );

  const renderPopoverMemberItem = ({ item }: { item: { id: string; nome: string; email: string } }) => {
    const isSelected = selectedMembros.some(member => member.id === item.id);
    
    return (
      <TouchableOpacity 
        style={[styles.popoverMemberItem, isSelected && styles.popoverMemberItemSelected]} 
        onPress={() => handleSelectMember(item)}
        activeOpacity={0.7}
      >
        <View style={styles.memberInfo}>
          <Text style={[styles.memberName, isSelected && styles.selectedMemberText]} numberOfLines={1}>
            {item.nome}
          </Text>
          <Text style={[styles.memberEmail, isSelected && styles.selectedMemberText]} numberOfLines={1}>
            {item.email}
          </Text>
        </View>
        <MaterialIcons 
          name={isSelected ? "check-circle" : "add-circle-outline"} 
          size={24} 
          color={isSelected ? "#48A6A7" : "#999"} 
        />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#9ACBD0" barStyle="light-content" />
      
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push('/(tabs)/grupos')}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back-ios" size={24} color="#006A71" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        <View style={styles.photoSection}>
          <TouchableOpacity style={styles.addPhotoButton} activeOpacity={0.7}>
            <MaterialIcons name="add-a-photo" size={56} color="#006A71" />
          </TouchableOpacity>
          <Text style={styles.addPhotoText}>Atualizar foto de perfil</Text>
        </View>


        <View style={styles.formSection}>
 
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nome do Grupo</Text>
            <Controller
              control={grupoForm.control}
              name="nome"
              render={({ field }) => (
                <TextInput
                  style={styles.textInput}
                  placeholder="Digite o nome do grupo"
                  value={field.value}
                  onChangeText={field.onChange}
                  placeholderTextColor="#999"
                />
              )}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Tipo</Text>
            <Controller
              control={grupoForm.control}
              name="descricao"
              render={({ field }) => (
                <View style={styles.tiposContainer}>
                  {tiposGrupo.map((tipo) => {
                    const IconComponent = tipo.component
                    const isSelected = tipoSelecionado === tipo.id
                    
                    return (
                      <View key={tipo.id} style={styles.tipoWrapper}>
                        <TouchableOpacity
                          style={[styles.tipoItem, isSelected && styles.tipoItemSelected]}
                          onPress={() => {
                            setTipoSelecionado(tipo.id)
                            field.onChange(tipo.id)
                          }}
                          activeOpacity={0.7}
                        >
                          <IconComponent 
                            name={tipo.icon as any} 
                            size={28} 
                            color={isSelected ? "#fff" : "#48A6A7"} 
                          />
                        </TouchableOpacity>
                        <Text style={[styles.tipoLabel, isSelected && styles.tipoLabelSelected]}>
                          {tipo.label}
                        </Text>
                      </View>
                    )
                  })}
                </View>
              )}
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.membersHeader}>
              <Text style={styles.inputLabel}>Membros ({selectedMembros.length})</Text>
              <TouchableOpacity
                style={styles.addMemberButton}
                onPress={() => setOpenMembersPopover(true)}
                activeOpacity={0.7}
              >
                <MaterialIcons name="person-add" size={20} color="#48A6A7" />
                <Text style={styles.addMemberText}>Adicionar</Text>
              </TouchableOpacity>
            </View>

            {selectedMembros.length > 0 ? (
              <View style={styles.membersContainer}>
                <FlatList
                  data={selectedMembros}
                  keyExtractor={item => item.id}
                  renderItem={renderMemberItem}
                  scrollEnabled={false}
                  showsVerticalScrollIndicator={false}
                />
              </View>
            ) : (
              <View style={styles.emptyMembersContainer}>
                <MaterialIcons name="group" size={48} color="#ccc" />
                <Text style={styles.emptyMembersText}>Nenhum membro adicionado</Text>
                <Text style={styles.emptyMembersSubtext}>Toque em "Adicionar" para incluir membros</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleSubmitGrupo}
          activeOpacity={0.8}
        >
          <Text style={styles.createButtonText}>CRIAR GRUPO</Text>
        </TouchableOpacity>
      </View>

 {openMembersPopover && (
  <Popover
    title="Adicionar Membros"
    onDismiss={() => setOpenMembersPopover(false)}
    contentStyle={styles.popoverContent}
  >
    <View style={styles.popoverBody}>
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nome ou email"
          value={searchText ?? ''}
          onChangeText={handleSearchDebounce}
          placeholderTextColor="#999"
        />
        {searchText && (
          <TouchableOpacity onPress={() => setSearchText(null)}>
            <MaterialIcons name="clear" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 16 }}>
        {selectedMembros.length > 0 && (
          <View style={styles.popoverSection}>
            <Text style={styles.sectionTitle}>Membros Selecionados ({selectedMembros.length})</Text>
          <FlatList
  data={selectedMembros}
  keyExtractor={item => `selected-${item.id}`}
  renderItem={renderPopoverMemberItem}
  style={styles.membersList}
  scrollEnabled={false}
  showsVerticalScrollIndicator={false}
/>
          </View>
        )}

        {membersFiltered.length > 0 && (
          <View style={styles.popoverSection}>
            <Text style={styles.sectionTitle}>Resultados da Busca</Text>
         <FlatList
  data={membersFiltered}
  keyExtractor={item => `filtered-${item.id}`}
  renderItem={renderPopoverMemberItem}
  style={styles.membersList}
  scrollEnabled={false}
  showsVerticalScrollIndicator={false}
/>
          </View>
        )}

        {searchText && searchText.length >= 3 && membersFiltered.length === 0 && (
          <View style={styles.emptySearchContainer}>
            <MaterialIcons name="search-off" size={48} color="#ccc" />
            <Text style={styles.emptySearchText}>Nenhum resultado encontrado</Text>
            <Text style={styles.emptySearchSubtext}>Tente buscar por outro nome ou email</Text>
          </View>
        )}
      </ScrollView>

      <View style={{ alignItems: 'center', marginTop: 12 }}>
        <TouchableOpacity
          onPress={() => setOpenMembersPopover(false)}
          style={{
            backgroundColor: '#006A71',
            paddingVertical: 10,
            paddingHorizontal: 18,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 14 }}>Adicionar</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Popover>
)}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F2F2",
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F4F2F2',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    color: "#006A71",
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  photoSection: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 16,
  },
  addPhotoButton: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoText: {
    fontFamily: "Poppins_300Light",
    fontSize: 12,
    color: "#777",
  },
  formSection: {
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#333",
    marginBottom: 16,
  },
  textInput: {
    height: 50,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: "#FAFAFA",
    fontFamily: "Inter",
    color: "#333",
  },
  tiposContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  tipoWrapper: {
    alignItems: "center",
    flex: 1,
    marginHorizontal: 4,
  },
  tipoItem: {
    width: (screenWidth - 120) / 4,
    height: (screenWidth - 120) / 4,
    maxWidth: 70,
    maxHeight: 70,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
  },
  tipoItemSelected: {
    backgroundColor: "#70B8BD",
    borderColor: "#65A4A5",
    borderWidth: 2,
  },
  tipoLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: "#666",
    marginTop: 6,
    textAlign: "center",
  },
  tipoLabelSelected: {
    color: "#65A4A5",
    fontFamily: "Poppins_600SemiBold",
  },
  membersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 22,
  },
  addMemberButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,  
    backgroundColor: '#C6DFE2',
    borderRadius: 16,
  },
  addMemberText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: "#006A71",
    marginLeft: 4,
  },
  membersContainer: {
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    padding: 8,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8F4F4',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  memberInfo: {
    flex: 1,
    marginRight: 12,
  },
  memberName: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  memberEmail: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#666',
  },
  emptyMembersContainer: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
  },
  emptyMembersText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: "#999",
    marginTop: 12,
  },
  emptyMembersSubtext: {
    fontFamily: "Inter",
    fontSize: 12,
    color: "#BBB",
    marginTop: 4,
    textAlign: 'center',
  },
  bottomActions: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  createButton: {
    backgroundColor: "#006A71",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  createButtonText: {
    color: "#fff",
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
  },
  popoverContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 300,
    maxHeight: 500,
  },
  popoverBody: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 14,
    fontFamily: "Inter",
    color: "#333",
  },
  popoverSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#333",
    marginBottom: 8,
  },
  membersList: {
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    padding: 4,
  },
  popoverMemberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E8F4F4',
  },
  popoverMemberItemSelected: {
    backgroundColor: '#F0F8F8',
    borderColor: '#48A6A7',
  },
  selectedMemberText: {
    color: '#48A6A7',
  },
  emptySearchContainer: {
    alignItems: 'center',
    padding: 32,
  },
  emptySearchText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: "#999",
    marginTop: 12,
  },
  emptySearchSubtext: {
    fontFamily: "Inter",
    fontSize: 12,
    color: "#BBB",
    marginTop: 4,
    textAlign: 'center',
  },
});