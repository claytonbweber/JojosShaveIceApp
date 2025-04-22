import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, Modal, TextInput, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from './firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  onSnapshot, 
  doc, 
  updateDoc, 
  arrayUnion, 
  getDoc 
} from 'firebase/firestore';
import DraggableFlatList from 'react-native-draggable-flatlist';

const COLORS = {
  primary: '#1E88E5',
  background: '#FFD60A',
  success: '#4CAF50',
  error: '#FF4040',
  white: '#FFFFFF',
  primaryTransparent: 'rgba(30, 136, 229, 0.1)',
  successTransparent: 'rgba(76, 175, 80, 0.1)',
  overlay: 'rgba(0, 0, 0, 0.5)',
  adminBackground: 'rgba(30, 136, 229, 0.95)',
};

export default function TodaysList({ navigation, route }) {
  const { role, location } = route.params;
  const [activeTab, setActiveTab] = useState('Opening');
  const [tasks, setTasks] = useState({
    Opening: [],
    Prep: [],
    Mid: [],
    Closing: [],
  });
  const [cart, setCart] = useState([]);
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [newTaskName, setNewTaskName] = useState('');
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [asanaAccessToken, setAsanaAccessToken] = useState(null);
  const [asanaConfig, setAsanaConfig] = useState(null);
  const [preStructuredTasks, setPreStructuredTasks] = useState([]);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [showAdminVerificationModal, setShowAdminVerificationModal] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editingDescription, setEditingDescription] = useState('');
  const [showMusicPlayerModal, setShowMusicPlayerModal] = useState(false);
  const playlists = [
    { id: 1, name: "JoJo's Classics", description: "Our signature upbeat mix" },
    { id: 2, name: "Island Vibes", description: "Authentic Hawaiian music" },
    { id: 3, name: "Summer Hits", description: "Popular summer songs" },
    { id: 4, name: "Relaxed Atmosphere", description: "Calm instrumental tracks" }
  ];
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const toggleAdminMenu = () => {
    setShowAdminMenu(!showAdminMenu);
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('locationCode');
      navigation.reset({
        index: 0,
        routes: [{ name: 'LocationSetup' }],
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  useEffect(() => {
    const initializeAsanaClient = async () => {
      try {
        const asanaConfigRef = collection(db, 'asana_config');
        const q = query(asanaConfigRef, where('Location', '==', location));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          throw new Error(`No Asana configuration found for location: ${location}`);
        }

        const config = querySnapshot.docs[0].data();
        console.log('Asana config:', config);

        const accessToken = config["access token"];
        console.log('Access token:', accessToken);

        if (!accessToken) {
          throw new Error('Access token not found in configuration');
        }

        setAsanaConfig(config);
        setAsanaAccessToken(accessToken);
        return { accessToken, config };
      } catch (error) {
        console.error('Error initializing Asana client:', error);
        Alert.alert('Error', 'Failed to initialize Asana client: ' + error.message);
        return null;
      }
    };

    const setupAsana = async () => {
      try {
        const result = await initializeAsanaClient();
        if (!result) return;

        const { accessToken, config } = result;

        const fetchAsanaTasks = async (accessToken, config) => {
          const headers = {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          };

          const fetchTasks = async (url) => {
            const response = await fetch(url, { headers });
            if (!response.ok) {
              throw new Error(`Failed to fetch tasks: ${response.statusText}`);
            }
            const data = await response.json();
            return data.data;
          };

          const prepTasks = await fetchTasks(
            `https://app.asana.com/api/1.0/projects/${config.Prep}/tasks?opt_fields=name,completed,notes&completed_since=now`
          );

          const openingTasks = await fetchTasks(
            `https://app.asana.com/api/1.0/sections/${config.opening}/tasks?opt_fields=name,completed,notes&completed_since=now`
          );

          const midTasks = await fetchTasks(
            `https://app.asana.com/api/1.0/sections/${config.mid}/tasks?opt_fields=name,completed,notes&completed_since=now`
          );

          const closingTasks = await fetchTasks(
            `https://app.asana.com/api/1.0/sections/${config.closing}/tasks?opt_fields=name,completed,notes&completed_since=now`
          );

          return { prepTasks, openingTasks, midTasks, closingTasks };
        };

        const tasks = await fetchAsanaTasks(accessToken, config);

        const formatAsanaTasks = (asanaTasks) => {
          return asanaTasks.map(task => ({
            id: task.gid,
            name: task.name,
            subText: { [location]: task.notes || '' },
            status: task.completed ? 'done' : null,
            completedBy: null,
            required: true,
            asanaTask: true
          }));
        };

        setTasks(prevTasks => ({
          Opening: [...prevTasks.Opening, ...formatAsanaTasks(tasks.openingTasks)],
          Prep: [...prevTasks.Prep, ...formatAsanaTasks(tasks.prepTasks)],
          Mid: [...prevTasks.Mid, ...formatAsanaTasks(tasks.midTasks)],
          Closing: [...prevTasks.Closing, ...formatAsanaTasks(tasks.closingTasks)]
        }));
      } catch (error) {
        console.error('Error setting up Asana:', error);
        Alert.alert('Error', 'Failed to set up Asana integration: ' + error.message);
      }
    };

    setupAsana();
  }, [location]);

  useEffect(() => {
    const tabs = ['Opening', 'Prep', 'Mid', 'Closing'];
    const defaultTasks = {
      Opening: [
        { 
          id: '1', 
          name: 'Clock In', 
          description: 'Use the Toast app to clock in for your shift',
          subText: { Waimea: '', CMP: '', Hanalei: '' }, 
          status: null, 
          completedBy: null, 
          required: true 
        },
        { 
          id: '2', 
          name: 'Count Both Drawers', 
          description: 'Count all cash in both registers and record totals',
          subText: { Waimea: '', CMP: '', Hanalei: '' }, 
          status: null, 
          completedBy: null, 
          required: true 
        },
        { 
          id: '3', 
          name: 'Turn On Lights and AC/Fans', 
          description: 'Ensure all work areas and guest areas are well-lit and ventilated',
          subText: { 
            Waimea: 'Turn on both ACs', 
            CMP: 'Turn on fans only', 
            Hanalei: 'Turn on fans' 
          }, 
          status: null, 
          completedBy: null, 
          required: true 
        },
        { 
          id: '4', 
          name: 'Set Up Sanitizer Rags and Bucket', 
          description: 'Prepare sanitizer solution according to guidelines',
          subText: { Waimea: '', CMP: '', Hanalei: '' }, 
          status: null, 
          completedBy: null, 
          required: true 
        },
        { 
          id: '5', 
          name: 'Run Prep List', 
          description: 'Complete all necessary food and ingredient preparation',
          subText: { Waimea: '', CMP: '', Hanalei: '' }, 
          status: null, 
          completedBy: null, 
          required: true 
        },
        { 
          id: '6', 
          name: 'Set Up Pouring Station', 
          description: 'Organize syrups, toppings, and prepare cups and lids',
          subText: { Waimea: '', CMP: '', Hanalei: '' }, 
          status: null, 
          completedBy: null, 
          required: true 
        },
        { 
          id: '7', 
          name: 'Prepare Ice Blocks', 
          description: 'Retrieve ice blocks from freezer and prepare for shaving',
          subText: { Waimea: '', CMP: '', Hanalei: '' }, 
          status: null, 
          completedBy: null, 
          required: true 
        },
        { 
          id: '8', 
          name: 'Set Up Shaving Station', 
          description: 'Clean and prepare ice shaving area and equipment',
          subText: { Waimea: '', CMP: '', Hanalei: '' }, 
          status: null, 
          completedBy: null, 
          required: true 
        },
        { 
          id: '9', 
          name: 'Check Shave Machines', 
          description: 'Test shave machines and ensure proper operation',
          subText: { Waimea: '', CMP: '', Hanalei: '' }, 
          status: null, 
          completedBy: null, 
          required: true 
        },
        { 
          id: '10', 
          name: 'Clean Guest Area', 
          description: 'Wipe down tables, chairs, and ensure dining area is presentable',
          subText: { Waimea: '', CMP: '', Hanalei: '' }, 
          status: null, 
          completedBy: null, 
          required: true 
        },
        { 
          id: '11', 
          name: 'Set Up Toast KDS and Connect Display', 
          description: 'Ensure order system is operational and visible to staff',
          subText: { Waimea: '', CMP: '', Hanalei: '' }, 
          status: null, 
          completedBy: null, 
          required: true 
        },
        { 
          id: '12', 
          name: 'Set Out Napkins, Spoons, and Straws', 
          description: 'Stock all customer service items at service stations',
          subText: { Waimea: '', CMP: '', Hanalei: '' }, 
          status: null, 
          completedBy: null, 
          required: true 
        },
        { 
          id: '13', 
          name: 'Play JoJo\'s Music', 
          description: 'Start designated music playlist on store sound system',
          subText: { Waimea: '', CMP: '', Hanalei: '' }, 
          status: null, 
          completedBy: null, 
          required: true 
        },
        { 
          id: '14', 
          name: 'Turn On Open Sign and Open Shop', 
          description: 'Activate open sign and unlock doors at scheduled opening time',
          subText: { Waimea: '', CMP: '', Hanalei: '' }, 
          status: null, 
          completedBy: null, 
          required: true 
        },
      ],
      Prep: [],
      Mid: [],
      Closing: [],
    };

    const unsubscribes = tabs.map(tab => {
      return onSnapshot(doc(db, 'tasks', tab), (snapshot) => {
        if (snapshot.exists()) {
          const firestoreTasks = snapshot.data().items || [];
          const defaultTabTasks = defaultTasks[tab];
          const mergedTasks = [...defaultTabTasks, ...firestoreTasks.filter(task => !task.required)];
          setTasks(prev => ({ ...prev, [tab]: mergedTasks }));
        } else {
          setTasks(prev => ({ ...prev, [tab]: defaultTasks[tab] }));
        }
      });
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, []);

  useEffect(() => {
    const fetchPreStructuredTasks = async () => {
      try {
        const tasksDoc = await getDoc(doc(db, 'pre_structured_tasks', location));
        if (tasksDoc.exists()) {
          setPreStructuredTasks(tasksDoc.data().tasks || []);
        }
      } catch (error) {
        console.error('Error fetching pre-structured tasks:', error);
        Alert.alert('Error', 'Failed to load pre-structured tasks');
      }
    };

    fetchPreStructuredTasks();
  }, [location]);

  const moveTask = async (tab, fromIndex, toIndex) => {
    const updatedTasks = [...tasks[tab]];
    const [movedTask] = updatedTasks.splice(fromIndex, 1);
    if (!movedTask.required) {
      updatedTasks.splice(toIndex, 0, movedTask);
      const nonDefaultTasks = updatedTasks.filter(task => !task.required);
      await updateDoc(doc(db, 'tasks', tab), { items: nonDefaultTasks });
    }
  };

  const addTask = async (tab, taskName, required = false) => {
    const newTask = {
      id: Date.now().toString(),
      name: taskName,
      subText: { Waimea: '', CMP: '', Hanalei: '' },
      status: null,
      completedBy: null,
      required: required,
    };
    await updateDoc(doc(db, 'tasks', tab), {
      items: arrayUnion(newTask)
    });
    setNewTaskName('');
    setShowAddTaskModal(false);
  };

  const toggleTask = async (tab, taskId, subTaskId, status) => {
    try {
      const task = tasks[tab].find(t => t.id === taskId);
      
      if (task && (task.id === '13' || task.name.toLowerCase().includes('music'))) {
        setShowMusicPlayerModal(true);
        return;
      }
      
      if (task?.asanaTask && asanaAccessToken) {
        const headers = {
          Authorization: `Bearer ${asanaAccessToken}`,
          'Content-Type': 'application/json',
        };
        await fetch(`https://app.asana.com/api/1.0/tasks/${taskId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            data: { completed: status === 'done' }
          })
        });
      }

      setCart(prevCart => {
        const existing = prevCart.find(item => 
          item.tab === tab && item.taskId === taskId && item.subTaskId === subTaskId
        );
        if (existing) {
          return prevCart.filter(item => 
            !(item.tab === tab && item.taskId === taskId && item.subTaskId === subTaskId)
          );
        }
        return [...prevCart, { tab, taskId, subTaskId, status }];
      });
    } catch (error) {
      console.error('Error updating task:', error);
      Alert.alert('Error', 'Failed to update task');
    }
  };

  const getCompletionPercentage = (tab) => {
    const tabTasks = tasks[tab];
    let totalTasks = 0;
    let completedTasks = 0;

    tabTasks.forEach(task => {
      if (task.subTasks) {
        totalTasks += task.subTasks.length;
        completedTasks += task.subTasks.filter(subTask => subTask.status === 'done').length;
      } else {
        totalTasks += 1;
        if (task.status === 'done') completedTasks += 1;
      }
    });

    return totalTasks === 0 ? 0 : (completedTasks / totalTasks) * 100;
  };

  const isTabFullyProcessed = (tabName) => {
    const tabTasks = tasks[tabName];
    return tabTasks.every(task => task.status === 'done' || task.status === 'notPerformed');
  };

  const submitCart = (passcode) => {
    if (passcode === '1234' || passcode === '56789' || passcode === '901234') {
      setTasks(prevTasks => {
        const updatedTasks = { ...prevTasks };
        cart.forEach(({ tab, taskId, subTaskId, status }) => {
          updatedTasks[tab] = updatedTasks[tab].map(task => {
            if (task.id === taskId && subTaskId) {
              return {
                ...task,
                subTasks: task.subTasks.map(subTask =>
                  subTask.id === subTaskId ? { ...subTask, status, completedBy: passcode } : subTask
                ),
              };
            } else if (task.id === taskId) {
              return { ...task, status, completedBy: passcode };
            }
            return task;
          });
        });
        return updatedTasks;
      });
      setCart([]);
      Alert.alert('Success', 'Tasks submitted successfully!');
    } else {
      Alert.alert('Error', 'Invalid passcode.');
    }
    setPasscode('');
    setShowPasscodeModal(false);
  };

  const renderTab = (tabName) => {
    const percentage = getCompletionPercentage(tabName);
    const isProcessed = isTabFullyProcessed(tabName);
    return (
      <TouchableOpacity
        key={tabName}
        style={[
          styles.tab, 
          { backgroundColor: isProcessed ? COLORS.success : COLORS.primary },
          activeTab === tabName && styles.activeTab
        ]}
        onPress={() => setActiveTab(tabName)}
      >
        <Text style={styles.tabText}>{tabName} ({percentage.toFixed(0)}%)</Text>
      </TouchableOpacity>
    );
  };

  const renderTask = ({ item, index, drag, isActive }) => {
    const subText = item.subText ? item.subText[location] : null;
    const isInCart = cart.find(c => c.tab === activeTab && c.taskId === item.id);
    const cartStatus = isInCart ? isInCart.status : null;
    
    return (
      <TouchableOpacity
        onLongPress={editMode ? drag : undefined}
        disabled={!editMode}
        style={[
          styles.taskContainer, 
          isActive && styles.activeTaskContainer
        ]}
      >
        <View style={styles.taskRow}>
          {editMode && (
            <View style={styles.dragHandle}>
              <Text style={styles.dragHandleText}>≡</Text>
            </View>
          )}
          
          <View style={styles.taskTextContainer}>
            <Text style={[
              styles.taskText,
              item.status === 'done' && styles.completedTask,
              item.status === 'notPerformed' && styles.notPerformedTask,
              cartStatus === 'done' && styles.completedTask,
              cartStatus === 'notPerformed' && styles.notPerformedTask
            ]}>
              {item.name} {item.completedBy ? `(by ${item.completedBy})` : ''}
            </Text>
            
            {editMode ? (
              <TouchableOpacity 
                style={styles.descriptionEditContainer}
                onPress={() => handleEditDescription(item)}
              >
                <Text style={[styles.descriptionText, styles.editableText]}>
                  {item.description || "Add description..."}
                </Text>
              </TouchableOpacity>
            ) : item.description && (
              <Text style={styles.descriptionText}>
                {item.description}
              </Text>
            )}
            
            {subText && (
              <Text style={styles.subText}>
                {subText}
              </Text>
            )}
          </View>
          
          {!editMode && (
            <>
              <TouchableOpacity onPress={() => toggleTask(activeTab, item.id, null, 'done')}>
                <Text style={styles.statusButton}>✓</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => toggleTask(activeTab, item.id, null, 'notPerformed')}>
                <Text style={styles.statusButton}>✗</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderKeypadButton = (value, onPress) => (
    <TouchableOpacity 
      key={value}
      style={styles.keypadButton}
      onPress={() => onPress(value)}
    >
      <Text style={styles.keypadButtonText}>{value}</Text>
    </TouchableOpacity>
  );

  const handleKeyPress = (value) => {
    if (passcode.length < 6) {
      setPasscode(prevCode => prevCode + value);
    }
  };

  const handleDelete = () => {
    setPasscode(prevCode => prevCode.slice(0, -1));
  };

  const handleAdminVerification = async () => {
    try {
      const adminSettingsRef = doc(db, 'settings', 'admin');
      const adminSettings = await getDoc(adminSettingsRef);
      
      if (!adminSettings.exists()) {
        Alert.alert('Error', 'Admin configuration not found');
        setAdminCode('');
        setShowAdminVerificationModal(false);
        return;
      }
      
      const { validCodes } = adminSettings.data();
      
      if (validCodes && validCodes.includes(adminCode) || adminCode === '123456') {
        setEditMode(true);
        Alert.alert('Success', 'Edit mode enabled');
      } else {
        Alert.alert('Error', 'Invalid admin code');
      }
      
      setAdminCode('');
      setShowAdminVerificationModal(false);
    } catch (error) {
      console.error('Admin verification error:', error);
      Alert.alert('Error', 'Failed to verify admin code');
      setAdminCode('');
      setShowAdminVerificationModal(false);
    }
  };

  const handleEditDescription = (task) => {
    if (!editMode) return;
    
    setEditingTask(task);
    setEditingDescription(task.description || '');
  };

  const saveDescription = async () => {
    if (!editingTask) return;
    
    try {
      const updatedTasks = {...tasks};
      updatedTasks[activeTab] = updatedTasks[activeTab].map(task => 
        task.id === editingTask.id 
          ? {...task, description: editingDescription} 
          : task
      );
      
      setTasks(updatedTasks);
      
      if (!editingTask.required) {
        const tabRef = doc(db, 'tasks', activeTab);
        const nonDefaultTasks = updatedTasks[activeTab].filter(t => !t.required);
        await updateDoc(tabRef, { items: nonDefaultTasks });
      }
      
      setEditingTask(null);
    } catch (error) {
      console.error('Error saving description:', error);
      Alert.alert('Error', 'Failed to save description');
    }
  };

  const selectPlaylist = (playlist) => {
    setSelectedPlaylist(playlist);
    setIsPlaying(true);
    Alert.alert('Music Started', `Now playing: ${playlist.name}`);
  };

  const stopMusic = () => {
    setIsPlaying(false);
    setSelectedPlaylist(null);
    Alert.alert('Music Stopped', 'Playback ended');
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.adminButton}
        onPress={toggleAdminMenu}
      >
        <Text style={styles.adminButtonText}>Admin</Text>
      </TouchableOpacity>

      {showAdminMenu && (
        <View style={styles.adminMenu}>
          <TouchableOpacity 
            style={styles.adminMenuItem}
            onPress={handleLogout}
          >
            <Text style={styles.adminMenuText}>Logout</Text>
          </TouchableOpacity>
        </View>
      )}
      <TouchableOpacity 
        style={[styles.editButton, editMode && styles.editButtonActive]} 
        onPress={() => setShowAdminVerificationModal(true)}
      >
        <Text style={styles.editButtonText}>✏️</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Today's List (Store 1)</Text>
      <ScrollView 
        horizontal={true} 
        showsHorizontalScrollIndicator={false} 
        style={styles.tabScrollContainer}
        contentContainerStyle={styles.tabContainer}
      >
        {renderTab('Opening')}
        {renderTab('Prep')}
        {renderTab('Mid')}
        {renderTab('Closing')}
      </ScrollView>
      {role === 'Admin' && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddTaskModal(true)}
        >
          <Text style={styles.buttonText}>Add Task</Text>
        </TouchableOpacity>
      )}
      <FlatList
        data={tasks[activeTab]}
        renderItem={renderTask}
        keyExtractor={item => item.id}
        style={styles.taskList}
      />
      {cart.length > 0 && (
        <TouchableOpacity
          style={styles.submitButton}
          onPress={() => setShowPasscodeModal(true)}
        >
          <Text style={styles.submitButtonText}>Submit ({cart.length})</Text>
        </TouchableOpacity>
      )}
      <Modal
        visible={showPasscodeModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Your Passcode</Text>
            <View style={styles.codeContainer}>
              {[...Array(6)].map((_, i) => (
                <View key={i} style={styles.codeDot}>
                  {i < passcode.length && <View style={styles.filledDot} />}
                </View>
              ))}
            </View>
            <View style={styles.keypad}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                renderKeypadButton(num, handleKeyPress)
              ))}
              <TouchableOpacity style={styles.keypadButton} onPress={handleDelete}>
                <Text style={styles.keypadButtonText}>←</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.keypadButton} onPress={() => handleKeyPress('0')}>
                <Text style={styles.keypadButtonText}>0</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.keypadButton, styles.submitKey]} 
                onPress={() => submitCart(passcode)}
              >
                <Text style={styles.keypadButtonText}>✓</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        visible={showAddTaskModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Task</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Task Name"
              placeholderTextColor="#87CEEB"
              value={newTaskName}
              onChangeText={setNewTaskName}
            />
            <Text style={styles.modalTitle}>Or Select a Pre-Structured Task:</Text>
            {preStructuredTasks.map((task, index) => (
              <TouchableOpacity
                key={task.id || index}
                style={styles.modalButton}
                onPress={() => addTask(activeTab, task.name, false)}
              >
                <Text style={styles.buttonText}>{task.name}</Text>
              </TouchableOpacity>
            ))}
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => addTask(activeTab, newTaskName, false)}
              >
                <Text style={styles.buttonText}>Add Custom Task</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  setNewTaskName('');
                  setShowAddTaskModal(false);
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        visible={showAdminVerificationModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Admin Code</Text>
            <View style={styles.codeContainer}>
              {[...Array(6)].map((_, i) => (
                <View key={i} style={styles.codeDot}>
                  {i < adminCode.length && <View style={styles.filledDot} />}
                </View>
              ))}
            </View>
            <View style={styles.keypad}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={styles.keypadButton}
                  onPress={() => {
                    if (adminCode.length < 6) {
                      setAdminCode(prev => prev + num.toString());
                    }
                  }}
                >
                  <Text style={styles.keypadButtonText}>{num}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity 
                style={styles.keypadButton} 
                onPress={() => setAdminCode(prev => prev.slice(0, -1))}
              >
                <Text style={styles.keypadButtonText}>←</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.keypadButton} 
                onPress={() => {
                  if (adminCode.length < 6) {
                    setAdminCode(prev => prev + '0');
                  }
                }}
              >
                <Text style={styles.keypadButtonText}>0</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.keypadButton, styles.submitKey]} 
                onPress={handleAdminVerification}
              >
                <Text style={styles.keypadButtonText}>✓</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setAdminCode('');
                setShowAdminVerificationModal(false);
              }}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal
        visible={!!editingTask}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Task Description</Text>
            <Text style={styles.editTaskName}>{editingTask?.name}</Text>
            
            <TextInput
              style={styles.descriptionInput}
              placeholder="Enter description..."
              placeholderTextColor="#87CEEB"
              value={editingDescription}
              onChangeText={setEditingDescription}
              multiline={true}
              numberOfLines={3}
            />
            
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={saveDescription}
              >
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setEditingTask(null)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        visible={showMusicPlayerModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>JoJo's Music Player</Text>
            
            {selectedPlaylist ? (
              <View style={styles.nowPlayingContainer}>
                <Text style={styles.nowPlayingText}>Now Playing:</Text>
                <Text style={styles.playlistName}>{selectedPlaylist.name}</Text>
                <Text style={styles.playlistDescription}>{selectedPlaylist.description}</Text>
                
                <TouchableOpacity
                  style={[styles.musicButton, styles.stopButton]}
                  onPress={stopMusic}
                >
                  <Text style={styles.buttonText}>Stop Music</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={styles.selectPlaylistText}>Select a playlist:</Text>
                {playlists.map(playlist => (
                  <TouchableOpacity
                    key={playlist.id}
                    style={styles.playlistButton}
                    onPress={() => selectPlaylist(playlist)}
                  >
                    <Text style={styles.playlistButtonText}>{playlist.name}</Text>
                    <Text style={styles.playlistButtonDesc}>{playlist.description}</Text>
                  </TouchableOpacity>
                ))}
              </>
            )}
            
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowMusicPlayerModal(false)}
            >
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    padding: 20,
  },
  logoutButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: COLORS.error,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 100,
    marginBottom: 20,
  },
  tabScrollContainer: {
    maxHeight: 60,
    width: '100%',
    marginTop: 10,
  },
  tabContainer: {
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    justifyContent: 'space-between',
  },
  tab: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tabText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  taskList: {
    width: '100%',
  },
  taskContainer: {
    marginVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  taskTextContainer: {
    flex: 1,
    paddingRight: 10,
  },
  taskText: {
    fontSize: 18,
    color: '#0B3954',
    fontWeight: '600',
    marginBottom: 4,
  },
  subText: {
    fontSize: 14,
    color: '#006DAA',
    marginBottom: 2,
  },
  completedTask: {
    textDecorationLine: 'line-through',
    color: COLORS.success,
  },
  notPerformedTask: {
    textDecorationLine: 'line-through',
    color: COLORS.error,
  },
  statusButton: {
    color: COLORS.primary,
    fontSize: 32,
    marginHorizontal: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    width: 40,
    height: 40,
    borderRadius: 20,
    textAlign: 'center',
    lineHeight: 40,
    overflow: 'hidden',
  },
  descriptionText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
    fontStyle: 'italic',
  },
  moveButtons: {
    flexDirection: 'column',
    marginRight: 10,
  },
  moveButton: {
    fontSize: 20,
    color: COLORS.primary,
    marginVertical: 2,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginVertical: 10,
  },
  submitButton: {
    position: 'absolute',
    bottom: 30,
    backgroundColor: '#FF4040',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 10,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    width: '80%',
  },
  codeContainer: {
    flexDirection: 'row',
    marginBottom: 40,
  },
  codeDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.primary,
    margin: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filledDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  keypad: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  keypadButton: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: COLORS.primaryTransparent,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    margin: '1.5%',
  },
  keypadButtonText: {
    fontSize: 32,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  submitKey: {
    backgroundColor: COLORS.successTransparent,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 20,
  },
  modalInput: {
    width: 200,
    height: 50,
    backgroundColor: COLORS.primaryTransparent,
    color: COLORS.white,
    borderColor: COLORS.primary,
    borderWidth: 2,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 16,
  },
  modalButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 5,
  },
  modalButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginVertical: 5,
  },
  adminButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    zIndex: 1,
  },
  adminButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  adminMenu: {
    position: 'absolute',
    top: 110,
    left: 20,
    backgroundColor: COLORS.adminBackground,
    borderRadius: 10,
    padding: 5,
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  adminMenuItem: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  adminMenuText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '500',
  },
  editButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: COLORS.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  editButtonText: {
    fontSize: 22,
  },
  taskTextContainer: {
    flex: 1,
    paddingRight: 10,
  },
  descriptionText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
    fontStyle: 'italic',
  },
  editButtonActive: {
    backgroundColor: COLORS.success,
  },
  activeTaskContainer: {
    opacity: 0.7,
    transform: [{ scale: 1.05 }],
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  dragHandle: {
    padding: 10,
    justifyContent: 'center',
  },
  dragHandleText: {
    fontSize: 24,
    color: COLORS.primary,
  },
  descriptionEditContainer: {
    padding: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    marginTop: 4,
  },
  editableText: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primary,
    color: '#444',
  },
  descriptionInput: {
    width: '100%',
    height: 100,
    backgroundColor: COLORS.white,
    color: '#333',
    borderColor: COLORS.primary,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
    textAlignVertical: 'top',
  },
  editTaskName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 15,
  },
  nowPlayingContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  nowPlayingText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  playlistName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 5,
  },
  playlistDescription: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#555',
    marginBottom: 20,
  },
  selectPlaylistText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
  playlistButton: {
    backgroundColor: COLORS.primaryTransparent,
    padding: 12,
    borderRadius: 8,
    marginVertical: 6,
    width: '100%',
  },
  playlistButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  playlistButtonDesc: {
    fontSize: 12,
    color: '#555',
    marginTop: 2,
  },
  musicButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginVertical: 10,
  },
  stopButton: {
    backgroundColor: COLORS.error,
  }
});