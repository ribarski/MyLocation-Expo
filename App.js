import { useState, useEffect } from "react";
import { FlatList, StyleSheet, View, Alert } from "react-native"; // Adicionado Alert para feedback de erro
import {
  Appbar,
  Button,
  List,
  PaperProvider,
  Switch,
  Text,
  MD3LightTheme as DefaultTheme,
} from "react-native-paper";
import AsyncStorage from '@react-native-async-storage/async-storage'; // Importar AsyncStorage
import myColors from "./assets/colors.json";
import myColorsDark from "./assets/colorsDark.json";

const DARK_MODE_KEY = "@darkMode"; // Chave para AsyncStorage (dark mode)
const LOCATIONS_KEY = "@locations"; // Chave para AsyncStorage (localizações)

export default function App() {
  const [isSwitchOn, setIsSwitchOn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [locations, setLocations] = useState([]); // Inicializar como array vazio

  const [theme, setTheme] = useState({
    ...DefaultTheme,
    myOwnProperty: true,
    colors: myColors.colors,
  });

  // Carrega o estado do darkMode do AsyncStorage
  async function loadDarkMode() {
    try {
      const storedDarkMode = await AsyncStorage.getItem(DARK_MODE_KEY);
      if (storedDarkMode !== null) {
        setIsSwitchOn(JSON.parse(storedDarkMode));
      }
    } catch (error) {
      console.error("Failed to load dark mode state from AsyncStorage", error);
      Alert.alert("Erro", "Não foi possível carregar a preferência de tema escuro.");
    }
  }

  // Evento do switch do darkMode, salva o novo estado
  async function onToggleSwitch() {
    const newSwitchState = !isSwitchOn;
    setIsSwitchOn(newSwitchState);
    try {
      await AsyncStorage.setItem(DARK_MODE_KEY, JSON.stringify(newSwitchState));
    } catch (error) {
      console.error("Failed to save dark mode state to AsyncStorage", error);
      Alert.alert("Erro", "Não foi possível salvar a preferência de tema escuro.");
    }
  }

  // Captura uma nova localização (fake) e a adiciona à lista persistida
  async function getLocation() {
    setIsLoading(true);

    // Localização fake, substituir por localização real do dispositivo se necessário
    const newLocation = {
      id: `loc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, // ID único
      latitude: -23.5505199 + (Math.random() * 0.1 - 0.05), // Variação aleatória
      longitude: -46.6333094 + (Math.random() * 0.1 - 0.05), // Variação aleatória
      timestamp: new Date().toISOString(),
    };

    try {
      const existingLocationsString = await AsyncStorage.getItem(LOCATIONS_KEY);
      let currentLocations = existingLocationsString ? JSON.parse(existingLocationsString) : [];
      
      const updatedLocations = [newLocation, ...currentLocations]; // Adiciona nova localização no início

      await AsyncStorage.setItem(LOCATIONS_KEY, JSON.stringify(updatedLocations));
      setLocations(updatedLocations);
    } catch (error) {
      console.error("Failed to save new location to AsyncStorage", error);
      Alert.alert("Erro", "Não foi possível salvar a nova localização.");
    } finally {
      setIsLoading(false);
    }
  }

  // Carrega as localizações salvas do AsyncStorage
  async function loadLocations() {
    setIsLoading(true);
    try {
      const storedLocationsString = await AsyncStorage.getItem(LOCATIONS_KEY);
      if (storedLocationsString !== null) {
        setLocations(JSON.parse(storedLocationsString));
      } else {
        // Se não houver localizações salvas, pode-se iniciar com uma lista vazia
        // ou gerar dados iniciais e salvá-los (como o comportamento original)
        const initialLocations = [];
        // Exemplo: Gerar 5 localizações iniciais se não houver nada salvo
        // for (let i = 0; i < 5; i++) {
        //   initialLocations.push({
        //     id: `init-${i}-${Date.now()}`,
        //     latitude: -23.5505199 + i * 0.005,
        //     longitude: -46.6333094 + i * 0.005,
        //     timestamp: new Date().toISOString(),
        //   });
        // }
        // await AsyncStorage.setItem(LOCATIONS_KEY, JSON.stringify(initialLocations));
        setLocations(initialLocations); // Inicia com array vazio se não houver dados
      }
    } catch (error) {
      console.error("Failed to load locations from AsyncStorage", error);
      Alert.alert("Erro", "Não foi possível carregar as localizações salvas.");
      setLocations([]); // Define como array vazio em caso de erro
    } finally {
      setIsLoading(false);
    }
  }

  // useEffect para carregar o darkMode e as localizações salvas
  // Executado apenas uma vez, quando o componente é montado
  useEffect(() => {
    loadDarkMode();
    loadLocations();
  }, []);

  // useEffect para alterar o tema (dark/light)
  // Executado sempre que a variável isSwitchOn é alterada
  useEffect(() => {
    if (isSwitchOn) {
      setTheme({ ...DefaultTheme, myOwnProperty: true, colors: myColorsDark.colors });
    } else {
      setTheme({ ...DefaultTheme, myOwnProperty: true, colors: myColors.colors });
    }
  }, [isSwitchOn]); // Removido 'theme' da dependência, pois ele é alterado aqui dentro

  return (
    <PaperProvider theme={theme}>
      <Appbar.Header>
        <Appbar.Content title="My Location BASE" />
      </Appbar.Header>
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <View style={styles.containerDarkMode}>
          <Text variant="titleMedium">Dark Mode</Text>
          <Switch value={isSwitchOn} onValueChange={onToggleSwitch} />
        </View>
        <Button
          style={styles.containerButton}
          icon="map-marker-plus" // Ícone mais apropriado
          mode="contained"
          loading={isLoading}
          onPress={getLocation} // Corrigido para chamar a função correta
        >
          Capturar Localização
        </Button>

        {locations && locations.length > 0 ? (
          <FlatList
            style={styles.containerList}
            data={locations}
            keyExtractor={(item) => item.id.toString()} // Garante IDs únicos para a lista
            renderItem={({ item }) => (
              <List.Item
                title={`ID: ${item.id.substring(0, 15)}...`} // Mostra parte do ID
                description={`Lat: ${item.latitude.toFixed(6)}, Lon: ${item.longitude.toFixed(6)}\nSalvo em: ${new Date(item.timestamp).toLocaleString()}`}
                left={(props) => <List.Icon {...props} icon="map-marker" />}
              />
            )}
          />
        ) : (
          <View style={styles.emptyListContainer}>
            <Text variant="bodyLarge">Nenhuma localização salva.</Text>
            <Text variant="bodySmall">Clique em "Capturar Localização" para adicionar.</Text>
          </View>
        )}
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: { // Não utilizado no App.js principal, mas mantido se houver outros usos
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  containerDarkMode: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    // borderRadius: 8, // Opcional: para um visual mais moderno
    // elevation: 1, // Opcional: para sombra (Android)
  },
  containerButton: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  containerList: {
    marginHorizontal: 16,
    // flex: 1, // Permite que a lista ocupe o espaço restante
  },
  emptyListContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  }
});