import React, { useState, useLayoutEffect, useContext } from "react";
import { View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Menu, IconButton, Icon } from "react-native-paper";
import { AuthContext } from "../context/AuthContext";

import DashboardScreen from "./DashboardScreen";
import AddFriendScreen from "./AddFriendScreen";
import CreateGroupScreen from "./CreateGroupScreen";
import FriendsScreen from "./FriendsScreen";
import GroupsScreen from "./GroupsScreen";
import GroupDetailScreen from "./GroupDetailScreen";
import AddExpenseScreen from "./AddExpenseScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function GroupsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="GroupsList" 
        component={GroupsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="GroupDetail" 
        component={GroupDetailScreen}
        options={{ presentation: "card" }}
      />
      <Stack.Screen 
        name="AddExpense" 
        component={AddExpenseScreen}
        options={{ presentation: "card", title: "Add Expense" }}
      />
    </Stack.Navigator>
  );
}

export default function HomeScreen({ navigation }) {
  const { logout } = useContext(AuthContext);
  const [menuVisible, setMenuVisible] = useState(false);

  // useLayoutEffect(() => {
  //   navigation.setOptions({
  //     headerShown: true,
  //     title: "Splitwise",
  //     headerRight: () => (
  //       <Menu
  //         visible={menuVisible}
  //         onDismiss={() => setMenuVisible(false)}
  //         anchor={
  //           <IconButton
  //             icon="dots-vertical"
  //             size={24}
  //             onPress={() => setMenuVisible(true)}
  //           />
  //         }
  //       >
  //         <Menu.Item
  //           onPress={() => {
  //             logout();
  //             setMenuVisible(false);
  //           }}
  //           title="Sign Out"
  //         />
  //       </Menu>
  //     ),
  //   });
  // }, [navigation, menuVisible, logout]);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,

        tabBarActiveTintColor: "#6366F1",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: "#E9ECEF",
          backgroundColor: "#FFFFFF",
          height: 80,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === "Dashboard") iconName = "view-dashboard";
          else if (route.name === "Groups") iconName = "account-group";
          else if (route.name === "Friends") iconName = "account-multiple";
          else if (route.name === "Add Friend") iconName = "account-plus";
          else if (route.name === "Create Group") iconName = "plus-circle";

          return <Icon source={iconName} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Groups" component={GroupsStack} />
      <Tab.Screen name="Friends" component={FriendsScreen} />
      <Tab.Screen name="Add Friend" component={AddFriendScreen} />
      <Tab.Screen name="Create Group" component={CreateGroupScreen} />
    </Tab.Navigator>
  );
}
