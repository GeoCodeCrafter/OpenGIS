import { Routes, Route } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { HomeScreen } from './screens/HomeScreen';
import { MapScreen } from './screens/MapScreen';
import { LocalModeScreen } from './screens/LocalModeScreen';
import { DatasetBrowserScreen } from './screens/DatasetBrowserScreen';

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/map" element={<MapScreen />} />
        <Route path="/local" element={<LocalModeScreen />} />
        <Route path="/datasets" element={<DatasetBrowserScreen />} />
      </Routes>
    </AppShell>
  );
}
