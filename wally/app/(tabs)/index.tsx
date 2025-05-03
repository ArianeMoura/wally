import React from "react";
import { StyleSheet, View, Text, Image } from "react-native";
import { useFonts, Poppins_700Bold, Poppins_300Light } from "@expo-google-fonts/poppins";
import BlueButton from "@/components/BlueButton";
import Logo from '../../assets/images/index_logo.png';
import Bckgd_Image from '../../assets/images/index_img.png';

export default function HomeScreen() {
  useFonts({
    Poppins_700Bold,
    Poppins_300Light
  });

  return (
    <View style={styles.container}>
      
      <View>
      <Image source={Logo} style={{ width: 80, height: 80 }} />
      <Text style={styles.logoText}>WALLY</Text>
      </View>
      <Image source={Bckgd_Image} />
      <View>
        <Text style={styles.textTitle}>Simplifique suas finanças!</Text>
        <Text style={styles.textSection}>
          Com sua nova carteira inteligente, gerenciar despesas pessoais e em grupo nunca foi tão fácil - controle tudo de forma fácil e eficiente!
        </Text>
        <BlueButton text="CRIAR CONTA" color="blue" />
        <BlueButton text="ENTRAR" color="lightblue" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    backgroundColor: "#fff",
    alignItems: 'center',
    justifyContent: 'space-evenly',
    fontSize: 16,
  },
  logoText: {
    fontFamily: "Poppins_300Light",
    textAlign: "center",
  },
  textTitle: {
    fontWeight: 600,
    textAlign: "center",
    fontFamily: "Poppins_700Bold",
  },
  textSection: {
    fontFamily: "Poppins_300Light",
    fontSize: 14,
    textAlign: "center",
    width: 310,
    marginBottom: 15
  },
});
