
import './App.css';
import { useState, useEffect } from 'react';

function App() {
  const [deviceStatus, setDeviceStatus] = useState('');
  const [deviceInfo, setDeviceInfo] = useState('');
  const [imageBase64, setImageBase64] = useState('');


  const getDeviceInfo = () => {
    if (window.DeviceInfo && typeof window.DeviceInfo.getDeviceInfo === 'function') {
      try {
        const info = window.DeviceInfo.getDeviceInfo();
        setDeviceInfo(typeof info === 'object' ? JSON.stringify(info, null, 2) : String(info));
      } catch {
        setDeviceInfo('Error getting device info.');
      }
    } else {
      setDeviceInfo('DeviceInfo API not available.');
    }
  };

  const initializeDevice = () => {
    if (window.Fingerprint && typeof window.Fingerprint.initializeDevice === 'function') {
      try {
        window.Fingerprint.initializeDevice();
        setDeviceStatus('Device initialized!');
      } catch {
        setDeviceStatus('Error initializing device.');
      }
    } else {
      setDeviceStatus('Fingerprint API not available.');
    }
  };

  const [fingerData, setFingerData] = useState(null);

  const capture = () => {
    if (window.Fingerprint && typeof window.Fingerprint.captureFingerprint === 'function') {
      try {
        const result = window.Fingerprint.captureFingerprint("Timeout=10000&Quality=50&licstr=&templateFormat=ISO&imageWSQRate=0.75");
        console.log("result", result)
        let parsed = null;
        if (typeof result === 'string' && result != null) {
          try {
            parsed = JSON.parse(result);
            console.log("parsed", parsed)
            if(parsed?.ImageDataBase64) {
              setImageBase64(parsed.ImageDataBase64);
            }
          } catch {
            setDeviceStatus('Capture returned invalid JSON.');
            setFingerData(null);
            return;
          }
        } else if (typeof result === 'object' && result !== null) {
          parsed = result;
        }
        setFingerData(parsed);
        setDeviceStatus(parsed && parsed.message ? parsed.message : 'Capture complete!');
      } catch {
        setDeviceStatus('Error capturing.');
        setFingerData(null);
      }
    } else {
      setDeviceStatus('Fingerprint API not available.');
      setFingerData(null);
    }
  };

  useEffect(() => {
    initializeDevice();
    // eslint-disable-next-line
  }, []);

  return (
    <>
      <div>
        <button onClick={getDeviceInfo}>Get Device Info</button>
        <button onClick={initializeDevice} style={{ marginLeft: '10px', background: '#2980b9', color: 'white', border: 'none', borderRadius: '4px', padding: '6px 14px' }}>Initialize Device</button>
        <button onClick={capture} style={{ marginLeft: '10px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '4px', padding: '6px 14px' }}>Capture</button>
        <div style={{ marginTop: '15px', color: 'blue' }}>{deviceStatus}</div>
        {deviceInfo && (
          <details style={{ marginTop: '10px', background: '#f4f4f4', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} open>
            <summary style={{ fontWeight: 'bold', color: '#2d7a2d', cursor: 'pointer' }}>Device Info (click to collapse/expand)</summary>
            <pre style={{ color: '#222', fontSize: '1em', whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0 }}>{deviceInfo}</pre>
          </details>
        )}

        {fingerData && (
          <details style={{ marginTop: '20px', background: '#f9f9f9', border: '1px solid #bbb', borderRadius: '6px', padding: '0' }} open>
            <summary style={{ fontWeight: 'bold', color: '#2980b9', fontSize: '1.1em', padding: '10px', cursor: 'pointer' }}>Fingerprint Capture Data (click to expand/collapse)</summary>
            <div style={{ padding: '10px' }}>
              <pre style={{ color: '#333', fontSize: '1em', whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0 }}>{JSON.stringify(fingerData, null, 2)}</pre>
            </div>
          </details>
        )}

        {imageBase64 && (
              <div style={{ marginTop: '15px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Fingerprint Image:</div>
               <img src={`data:image/png;base64,${imageBase64}`} 
               alt="Captured Fingerprint" 
               style={{ maxWidth: '300px', maxHeight: '300px', border: '1px solid #ccc', borderRadius: '4px', background: '#fff', marginTop: '20px' }}
               />
              </div>
            )}

      </div>
    </>
  );
}

export default App;
