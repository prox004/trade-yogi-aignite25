import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NseIndia } from "stock-nse-india";
import { Tabs } from 'expo-router';
import { router, useRouter } from 'expo-router';
import NewsFeed from '../../components/NewsFeed';

interface Stock {
  symbol: string;
  lastPrice: number;
  change: number;
  pChange: number;
  companyName: string;
}

interface NiftyData {
  symbol: string;
  lastPrice: number;
  change: number;
  pChange: number;
}

const NiftyTicker = () => {
  const [niftyData, setNiftyData] = useState<NiftyData[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollX = new Animated.Value(0);
  const ANIMATION_DURATION = 100000; // 100 seconds for one complete scroll
  const animationRef = React.useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    fetchNiftyData();
    const interval = setInterval(fetchNiftyData, 60000);
    return () => {
      clearInterval(interval);
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    if (niftyData.length > 0) {
      const totalWidth = niftyData.length * 200;
      
      if (animationRef.current) {
        animationRef.current.stop();
      }

      scrollX.setValue(0);

      animationRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(scrollX, {
            toValue: -totalWidth,
            duration: ANIMATION_DURATION,
            useNativeDriver: true,
          }),
          Animated.timing(scrollX, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          })
        ])
      );

      animationRef.current.start();
    }
  }, [niftyData]);

  const fetchNiftyData = async () => {
    try {
      const nseIndia = new NseIndia();
      const response = await nseIndia.getEquityStockIndices("NIFTY 50");
      
      if (response && response.data) {
        const data: NiftyData[] = response.data.map((stock: any) => ({
          symbol: stock.symbol,
          lastPrice: stock.lastPrice,
          change: stock.change,
          pChange: stock.pChange
        }));
        setNiftyData(data);
      }
    } catch (error) {
      console.error('Error fetching Nifty data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.tickerContainer}>
        <Text style={styles.tickerText}>Loading Nifty data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.tickerContainer}>
      <Animated.View
        style={[
          styles.tickerContent,
          {
            transform: [{ translateX: scrollX }],
          },
        ]}
      >
        {[...niftyData, ...niftyData].map((stock, index) => (
          <View key={index} style={styles.tickerItem}>
            <Text style={styles.tickerSymbol}>{stock.symbol}</Text>
            <Text style={styles.tickerPrice}>₹{stock.lastPrice.toLocaleString('en-IN')}</Text>
            <Text style={[
              styles.tickerChange,
              { color: stock.pChange >= 0 ? '#34C759' : '#FF3B30' }
            ]}>
              {stock.pChange >= 0 ? '+' : ''}{stock.pChange.toFixed(2)}%
            </Text>
          </View>
        ))}
      </Animated.View>
    </View>
  );
};

export default function HomeScreen() {
  const [portfolioBalance, setPortfolioBalance] = useState<string>('0');
  const [topGainers, setTopGainers] = useState<Stock[]>([]);
  const [topLosers, setTopLosers] = useState<Stock[]>([]);
  const [activeTab, setActiveTab] = useState<'gainers' | 'losers'>('gainers');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadBalance();
    fetchStocks();
    const interval = setInterval(fetchStocks, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const loadBalance = async () => {
    try {
      const balance = await AsyncStorage.getItem('portfolioBalance');
      if (balance) {
        setPortfolioBalance(balance);
      }
    } catch (error) {
      console.error('Error loading balance:', error);
    }
  };

  const fetchStocks = async () => {
    try {
      setLoading(true);
      const nseIndia = new NseIndia();
      const response = await nseIndia.getEquityStockIndices("NIFTY 50");
      
      if (response && response.data) {
        const stocks: Stock[] = response.data.map((stock: any) => ({
          symbol: stock.symbol,
          lastPrice: stock.lastPrice,
          change: stock.change,
          pChange: stock.pChange,
          companyName: stock.meta?.companyName || stock.symbol
        }));

        // Sort for gainers and losers
        const sortedStocks = stocks.sort((a, b) => b.pChange - a.pChange);
        setTopGainers(sortedStocks.slice(0, 10));
        setTopLosers(sortedStocks.slice(-10).reverse());
      }
    } catch (error) {
      console.error('Error fetching stocks:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStockItem = ({ item }: { item: Stock }) => (
    <TouchableOpacity
      onPress={() => router.push(`/stock/${item.symbol}`)}
    >
      <LinearGradient
        colors={['#FFFFFF', '#F8F8F8']}
        style={styles.stockItem}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.stockInfo}>
          <Text style={styles.stockSymbol}>{item.symbol}</Text>
          <Text style={styles.companyName} numberOfLines={1}>{item.companyName}</Text>
          <Text style={styles.stockPrice}>₹{item.lastPrice.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}</Text>
        </View>
        <View style={styles.stockChange}>
          <Text style={[
            styles.changeText,
            { color: item.pChange >= 0 ? '#34C759' : '#FF3B30' }
          ]}>
            {item.pChange >= 0 ? '+' : ''}{item.pChange.toFixed(2)}%
          </Text>
          <Text style={[
            styles.changeAmount,
            { color: item.pChange >= 0 ? '#34C759' : '#FF3B30' }
          ]}>
            {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}
          </Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const handleResetOnboarding = async () => {
    try {
      await AsyncStorage.removeItem('onboardingComplete');
      router.replace('/onboarding');
    } catch (error) {
      console.error('Error clearing onboarding status:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Tabs.Screen
        options={{
          headerShown: false,
        }}
      />

      <View style={styles.content}>
        <NiftyTicker />
        
        <TouchableOpacity style={styles.resetButton} onPress={handleResetOnboarding}>
          <Text style={styles.resetButtonText}>Reset Onboarding</Text>
        </TouchableOpacity>

        <LinearGradient
          colors={['#1E2A3B', '#2C3E50']}
          style={styles.balanceCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.balanceLabel}>Portfolio Balance</Text>
          <Text style={styles.balanceAmount}>
            ₹{parseFloat(portfolioBalance).toLocaleString('en-IN', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </Text>
        </LinearGradient>

        <View style={styles.stocksSection}>
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'gainers' && styles.activeTab]}
              onPress={() => setActiveTab('gainers')}
            >
              <Text style={[styles.tabText, activeTab === 'gainers' && styles.activeTabText]}>
                Top Gainers
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'losers' && styles.activeTab]}
              onPress={() => setActiveTab('losers')}
            >
              <Text style={[styles.tabText, activeTab === 'losers' && styles.activeTabText]}>
                Top Losers
              </Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={activeTab === 'gainers' ? topGainers : topLosers}
            renderItem={renderStockItem}
            keyExtractor={(item) => item.symbol}
            contentContainerStyle={styles.stocksList}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerContent: {
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  balanceCard: {
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  stocksSection: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    borderColor:'#007AFF',
    borderWidth:1
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  stocksList: {
    paddingBottom: 16,
  },
  stockItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderColor:'gray',
    borderWidth:1,
  },
  stockInfo: {
    flex: 1,
    marginRight: 8,
  },
  stockSymbol: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  companyName: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  stockPrice: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    fontWeight:'bold'
  },
  stockChange: {
    alignItems: 'flex-end',
    minWidth: 100,
  },
  changeText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  changeAmount: {
    fontSize: 14,
    marginTop: 4,
  },
  tickerContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingVertical: 12,
    marginBottom: 16,
    overflow: 'hidden',
    width: '100%',
    marginHorizontal: 0,
    paddingHorizontal: 0,
  },
  tickerContent: {
    flexDirection: 'row',
    width: '100%',
    marginHorizontal: 0,
    paddingHorizontal: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 0,
    paddingHorizontal: 12,
    minWidth: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 0,
    borderWidth: 0,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
  },
  tickerSymbol: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginRight: 8,
    minWidth: 60,
  },
  tickerPrice: {
    fontSize: 14,
    color: '#000000',
    marginRight: 8,
    minWidth: 80,
  },
  tickerChange: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 60,
  },
  tickerText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
    marginHorizontal: 12,
  },
  resetButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E6F0FF',
  },
  resetButtonText: {
    color: '#E6F0FF',
    fontSize: 14,
  },
});
