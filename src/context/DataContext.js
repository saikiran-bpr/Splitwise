// src/context/DataContext.js
import React, { createContext, useState, useEffect, useContext } from "react";
import { AuthContext } from "./AuthContext";
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  arrayUnion, 
  arrayRemove,
  onSnapshot,
  addDoc,
  serverTimestamp
} from "firebase/firestore";
import { db } from "../../firebase";

export const DataContext = createContext();

export default function DataProvider({ children }) {
  const { user } = useContext(AuthContext);
  const [friends, setFriends] = useState([]);
  const [groups, setGroups] = useState([]);
  const [settledExpenses, setSettledExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [usersCache, setUsersCache] = useState({});

  // Fetch friends
  useEffect(() => {
    if (!user) {
      setFriends([]);
      setGroups([]);
      setLoading(false);
      return;
    }

    const unsubscribeFriends = onSnapshot(
      collection(db, "users", user.uid, "friends"),
      (snapshot) => {
        const friendsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setFriends(friendsList);
      },
      (error) => {
        console.error("Error fetching friends:", error);
        setFriends([]);
      }
    );

    return () => unsubscribeFriends();
  }, [user]);

  // Fetch groups
  useEffect(() => {
    if (!user) {
      setGroups([]);
      setLoading(false);
      return;
    }

    const unsubscribeGroups = onSnapshot(
      query(collection(db, "groups"), where("members", "array-contains", user.uid)),
      async (snapshot) => {
        const groupsList = await Promise.all(
          snapshot.docs.map(async (doc) => {
            const groupData = doc.data();
            const expensesSnapshot = await getDocs(collection(db, "groups", doc.id, "expenses"));
            const expenses = expensesSnapshot.docs.map(expDoc => ({
              id: expDoc.id,
              ...expDoc.data()
            }));
            return {
              id: doc.id,
              ...groupData,
              expenses: expenses.sort((a, b) => {
                const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date || 0);
                const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date || 0);
                return dateB - dateA;
              })
            };
          })
        );
        setGroups(groupsList);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching groups:", error);
        setGroups([]);
        setLoading(false);
      }
    );

    return () => unsubscribeGroups();
  }, [user]);

  // Fetch settled expenses (supports more than 10 groups by chunking queries)
  useEffect(() => {
    if (!user || groups.length === 0) {
      setSettledExpenses([]);
      return;
    }

    const groupIds = groups.map(g => g.id);
    if (groupIds.length === 0) {
      setSettledExpenses([]);
      return;
    }

    const chunkSize = 10; // Firestore "in" supports up to 10 values
    const chunks = [];
    for (let i = 0; i < groupIds.length; i += chunkSize) {
      chunks.push(groupIds.slice(i, i + chunkSize));
    }

    const unsubscribers = chunks.map(ids => 
      onSnapshot(
        query(collection(db, "settledExpenses"), where("groupId", "in", ids)),
        (snapshot) => {
          const newDocs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          setSettledExpenses(prev => {
            // Keep previous entries for other chunks, replace entries for current chunk
            const filteredPrev = prev.filter(s => !ids.includes(s.groupId));
            return [...filteredPrev, ...newDocs];
          });
        },
        (error) => {
          console.error("Error fetching settled expenses:", error);
        }
      )
    );

    return () => {
      unsubscribers.forEach(unsub => {
        try {
          unsub && unsub();
        } catch (err) {
          console.error("Error unsubscribing settledExpenses listener:", err);
        }
      });
    };
  }, [user, groups]);

  const addFriend = async (email, name) => {
    try {
      // Find user by email
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email.trim()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error("No user found with this email");
      }

      const friendDoc = querySnapshot.docs[0];
      const friendId = friendDoc.id;

      if (friendId === user.uid) {
        throw new Error("You cannot add yourself");
      }

      // Check if already a friend
      const friendRef = doc(db, "users", user.uid, "friends", friendId);
      const friendSnap = await getDoc(friendRef);
      
      if (friendSnap.exists()) {
        throw new Error("Friend already added");
      }

      // Add friend
      await setDoc(friendRef, {
        email: friendDoc.data().email,
        name: name || friendDoc.data().name || email.split("@")[0],
        addedAt: serverTimestamp(),
      });

      return { id: friendId, email: friendDoc.data().email, name: name || friendDoc.data().name || email.split("@")[0] };
    } catch (error) {
      throw error;
    }
  };

  const deleteFriend = async (friendId) => {
    try {
      await deleteDoc(doc(db, "users", user.uid, "friends", friendId));
    } catch (error) {
      throw error;
    }
  };

  const createGroup = async (name, memberIds) => {
    try {
      const groupRef = doc(collection(db, "groups"));
      await setDoc(groupRef, {
        name,
        members: [user.uid, ...memberIds],
        createdBy: user.uid,
        createdAt: serverTimestamp(),
      });
      return { id: groupRef.id, name, members: [user.uid, ...memberIds], expenses: [] };
    } catch (error) {
      throw error;
    }
  };

  const addMemberToGroup = async (groupId, memberIds) => {
    try {
      const groupRef = doc(db, "groups", groupId);
      await updateDoc(groupRef, {
        members: arrayUnion(...memberIds),
      });
    } catch (error) {
      console.error("Error adding member to group:", error);
      throw error;
    }
  };

  const deleteGroup = async (groupId) => {
    try {
      // Delete all expenses first
      const expensesSnapshot = await getDocs(collection(db, "groups", groupId, "expenses"));
      const deletePromises = expensesSnapshot.docs.map(expDoc => 
        deleteDoc(doc(db, "groups", groupId, "expenses", expDoc.id))
      );
      await Promise.all(deletePromises);
      
      // Delete group
      await deleteDoc(doc(db, "groups", groupId));
    } catch (error) {
      throw error;
    }
  };

  const addExpense = async (groupId, expense) => {
    try {
      const expensesRef = collection(db, "groups", groupId, "expenses");
      await addDoc(expensesRef, {
        ...expense,
        date: serverTimestamp(),
      });
      console.log("Expense added successfully to group:", groupId);
    } catch (error) {
      console.error("Error adding expense:", error);
      throw error;
    }
  };

  const deleteExpense = async (groupId, expenseId) => {
    try {
      await deleteDoc(doc(db, "groups", groupId, "expenses", expenseId));
    } catch (error) {
      throw error;
    }
  };

  const settleUp = async (groupId, fromUserId, toUserId, amount) => {
    try {
      const settleRef = doc(collection(db, "settledExpenses"));
      await setDoc(settleRef, {
        groupId,
        fromUserId,
        toUserId,
        amount,
        date: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error settling up:", error);
      throw error;
    }
  };

  const calculateBalances = (groupId) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return {};

    const balances = {};
    group.members.forEach(memberId => {
      balances[memberId] = 0;
    });

    group.expenses.forEach(expense => {
      const splitAmount = expense.amount / expense.splitBetween.length;
      balances[expense.paidBy] += expense.amount;
      expense.splitBetween.forEach(memberId => {
        balances[memberId] -= splitAmount;
      });
    });

    // Apply settled expenses
    settledExpenses
      .filter(s => s.groupId === groupId)
      .forEach(settle => {
        balances[settle.fromUserId] -= settle.amount;
        balances[settle.toUserId] += settle.amount;
      });

    return balances;
  };

  const getTotalBalance = () => {
    let totalOwed = 0;
    let totalOwing = 0;

    groups.forEach(group => {
      const balances = calculateBalances(group.id);
      const userBalance = balances[user?.uid] || 0;
      if (userBalance > 0) {
        totalOwed += userBalance;
      } else if (userBalance < 0) {
        totalOwing += Math.abs(userBalance);
      }
    });

    return { totalOwed, totalOwing };
  };

  // Fetch user information for group members
  useEffect(() => {
    if (!user || groups.length === 0) return;

    const fetchUserInfo = async () => {
      const userIds = new Set();
      
      // Collect all unique user IDs from groups
      groups.forEach(group => {
        if (group.members) {
          group.members.forEach(memberId => {
            if (memberId !== user.uid) {
              userIds.add(memberId);
            }
          });
        }
      });

      if (userIds.size === 0) return;

      // Get current cache and friends to check what we need to fetch
      // Check friends outside setState to avoid stale closure
      const friendIds = new Set(friends.map(f => f.id));
      
      setUsersCache(currentCache => {
        // Filter out users we already have in cache or friends
        const usersToFetch = Array.from(userIds).filter(userId => {
          // Skip if already in friends
          if (friendIds.has(userId)) return false;
          // Skip if already in cache
          if (currentCache[userId]) return false;
          return true;
        });

        if (usersToFetch.length === 0) return currentCache;

        // Fetch user info asynchronously
        Promise.all(
          usersToFetch.map(async (userId) => {
            try {
              const userDoc = await getDoc(doc(db, "users", userId));
              if (userDoc.exists()) {
                return { id: userId, ...userDoc.data() };
              }
              return null;
            } catch (error) {
              console.error(`Error fetching user ${userId}:`, error);
              return null;
            }
          })
        ).then(userData => {
          setUsersCache(prevCache => {
            const updatedCache = { ...prevCache };
            userData.forEach(userInfo => {
              if (userInfo) {
                updatedCache[userInfo.id] = userInfo;
              }
            });
            return updatedCache;
          });
        });

        return currentCache;
      });
    };

    fetchUserInfo();
  }, [groups, user, friends]);

  const getUserName = (userId) => {
    if (!userId) return "Unknown";
    if (userId === user?.uid) return "You";
    
    // Check friends first
    const friend = friends.find(f => f.id === userId);
    if (friend) {
      return friend.name || friend.email || "Unknown";
    }
    
    // Check users cache
    const cachedUser = usersCache[userId];
    if (cachedUser) {
      return cachedUser.name || cachedUser.email || "Unknown";
    }
    
    // If not found, try to fetch it (this will cache it for next time)
    // But return a fallback immediately
    if (userId && userId !== user?.uid) {
      // Trigger async fetch
      getDoc(doc(db, "users", userId))
        .then(userDoc => {
          if (userDoc.exists()) {
            setUsersCache(prevCache => ({
              ...prevCache,
              [userId]: { id: userId, ...userDoc.data() }
            }));
          }
        })
        .catch(error => {
          console.error(`Error fetching user ${userId} in getUserName:`, error);
        });
    }
    
    // Return fallback - will update when fetch completes
    return "Unknown";
  };

  const getUserEmail = (userId) => {
    if (userId === user?.uid) return user?.email;
    
    // Check friends first
    const friend = friends.find(f => f.id === userId);
    if (friend) {
      return friend.email || "Unknown";
    }
    
    // Check users cache
    const cachedUser = usersCache[userId];
    if (cachedUser) {
      return cachedUser.email || "Unknown";
    }
    
    return "Unknown";
  };

  const getRecentActivity = () => {
    const activities = [];
    
    groups.forEach(group => {
      group.expenses.forEach(expense => {
        activities.push({
          id: expense.id,
          type: "expense",
          groupId: group.id,
          groupName: group.name,
          description: expense.description,
          amount: expense.amount,
          paidBy: expense.paidBy,
          date: expense.date?.toDate ? expense.date.toDate().toISOString() : expense.date,
        });
      });
    });

    settledExpenses.forEach(settle => {
      const group = groups.find(g => g.id === settle.groupId);
      activities.push({
        id: settle.id,
        type: "settle",
        groupId: settle.groupId,
        groupName: group?.name || "Unknown",
        fromUserId: settle.fromUserId,
        toUserId: settle.toUserId,
        amount: settle.amount,
        date: settle.date?.toDate ? settle.date.toDate().toISOString() : settle.date,
      });
    });

    return activities.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 20);
  };

  const calculatePairwiseBalance = (groupId, userId1, userId2) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return 0;

    let netBalance = 0;

    // Calculate from expenses shared between the two users
    group.expenses.forEach(expense => {
      if (!expense.splitBetween.includes(userId1) || !expense.splitBetween.includes(userId2)) {
        return; // Skip expenses not shared between the two users
      }

      const splitAmount = expense.amount / expense.splitBetween.length;
      
      if (expense.paidBy === userId1) {
        // User1 paid, User2 should pay their share
        // Positive means User2 owes User1
        netBalance += splitAmount;
      } else if (expense.paidBy === userId2) {
        // User2 paid, User1 should pay their share
        // Negative means User1 owes User2
        netBalance -= splitAmount;
      }
    });

    // Apply settlements between the two users
    settledExpenses
      .filter(s => s.groupId === groupId && 
        ((s.fromUserId === userId1 && s.toUserId === userId2) || 
         (s.fromUserId === userId2 && s.toUserId === userId1)))
      .forEach(settle => {
        if (settle.fromUserId === userId1 && settle.toUserId === userId2) {
          // User1 paid User2 (User1 settled with User2)
          netBalance -= settle.amount;
        } else {
          // User2 paid User1 (User2 settled with User1)
          netBalance += settle.amount;
        }
      });

    return netBalance;
  };

  const refreshData = async () => {
    if (!user) return;
    
    setRefreshing(true);
    try {
      // Refresh friends
      const friendsSnapshot = await getDocs(collection(db, "users", user.uid, "friends"));
      const friendsList = friendsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setFriends(friendsList);

      // Refresh groups and expenses
      const groupsSnapshot = await getDocs(
        query(collection(db, "groups"), where("members", "array-contains", user.uid))
      );
      const groupsList = await Promise.all(
        groupsSnapshot.docs.map(async (doc) => {
          const groupData = doc.data();
          const expensesSnapshot = await getDocs(collection(db, "groups", doc.id, "expenses"));
          const expenses = expensesSnapshot.docs.map(expDoc => ({
            id: expDoc.id,
            ...expDoc.data()
          }));
          return {
            id: doc.id,
            ...groupData,
            expenses: expenses.sort((a, b) => {
              const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date || 0);
              const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date || 0);
              return dateB - dateA;
            })
          };
        })
      );
      setGroups(groupsList);

      // Refresh settled expenses
      const groupIds = groupsList.map(g => g.id);
      if (groupIds.length > 0) {
        const settledSnapshot = await getDocs(
          query(collection(db, "settledExpenses"), where("groupId", "in", groupIds.slice(0, 10)))
        );
        const settledList = settledSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setSettledExpenses(settledList);
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <DataContext.Provider
      value={{
        friends,
        groups,
        loading,
        refreshing,
        refreshData,
        addFriend,
        deleteFriend,
        createGroup,
        addMemberToGroup,
        deleteGroup,
        addExpense,
        deleteExpense,
        settleUp,
        calculateBalances,
        calculatePairwiseBalance,
        getTotalBalance,
        getRecentActivity,
        getUserName,
        getUserEmail,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}
