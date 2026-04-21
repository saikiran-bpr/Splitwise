import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Icon } from "react-native-paper";

import DashboardScreen from "./DashboardScreen";
import FriendsScreen from "./FriendsScreen";
import AddFriendScreen from "./AddFriendScreen";
import GroupsScreen from "./GroupsScreen";
import CreateGroupScreen from "./CreateGroupScreen";
import GroupDetailScreen from "./GroupDetailScreen";
import AddExpenseScreen from "./AddExpenseScreen";
import AddMemberToGroupScreen from "./AddMemberToGroupScreen";
import EditExpenseScreen from "./EditExpenseScreen";
import ActivityScreen from "./ActivityScreen";
import ProfileScreen from "./ProfileScreen";
import SettleUpScreen from "./SettleUpScreen";
import ExpenseDetailScreen from "./ExpenseDetailScreen";

const Tab = createBottomTabNavigator();
const GroupStack = createNativeStackNavigator();
const FriendStack = createNativeStackNavigator();

function GroupsStackNavigator() {
  return (
    <GroupStack.Navigator>
      <GroupStack.Screen
        name="GroupsList"
        component={GroupsScreen}
        options={{ headerShown: false }}
      />
      <GroupStack.Screen
        name="CreateGroup"
        component={CreateGroupScreen}
        options={{ presentation: "card", title: "Create Group" }}
      />
      <GroupStack.Screen
        name="GroupDetail"
        component={GroupDetailScreen}
        options={{ presentation: "card" }}
      />
      <GroupStack.Screen
        name="AddExpense"
        component={AddExpenseScreen}
        options={{ presentation: "card", title: "Add Expense" }}
      />
      <GroupStack.Screen
        name="AddMember"
        component={AddMemberToGroupScreen}
        options={{ presentation: "card", title: "Add Members" }}
      />
      <GroupStack.Screen
        name="EditExpense"
        component={EditExpenseScreen}
        options={{ presentation: "card", title: "Edit Expense" }}
      />
      <GroupStack.Screen
        name="SettleUp"
        component={SettleUpScreen}
        options={{ presentation: "card", title: "Settle Up" }}
      />
      <GroupStack.Screen
        name="ExpenseDetail"
        component={ExpenseDetailScreen}
        options={{ presentation: "card", title: "Expense Details" }}
      />
    </GroupStack.Navigator>
  );
}

function FriendsStackNavigator() {
  return (
    <FriendStack.Navigator>
      <FriendStack.Screen
        name="FriendsList"
        component={FriendsScreen}
        options={{ headerShown: false }}
      />
      <FriendStack.Screen
        name="AddFriend"
        component={AddFriendScreen}
        options={{ presentation: "card", title: "Add Friend" }}
      />
    </FriendStack.Navigator>
  );
}

export default function HomeScreen() {
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
        tabBarIcon: ({ color }) => {
          let iconName;

          if (route.name === "Dashboard") iconName = "view-dashboard";
          else if (route.name === "Groups") iconName = "account-group";
          else if (route.name === "Friends") iconName = "account-multiple";
          else if (route.name === "Activity") iconName = "bell-outline";
          else if (route.name === "Profile") iconName = "account-circle";

          return <Icon source={iconName} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Groups" component={GroupsStackNavigator} />
      <Tab.Screen name="Friends" component={FriendsStackNavigator} />
      <Tab.Screen name="Activity" component={ActivityScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
