import { useState, useEffect } from 'react';
import RightHand from './assets/images/Right-hand.png';
import LeftHand from './assets/images/Left-hand.png';

const rightHandDots = [
  { index: 0, top: "10%", left: "50%" }, // thumb (bottom right)
  { index: 1, top: "35%", left: "10%" }, // index
  { index: 2, top: "58%", left: "5%" }, // middle
  { index: 3, top: "75%", left: "12%" }, // ring
  { index: 4, top: "90%", left: "18%" }, // little (top left)
];

const fingerDots = {
  right: rightHandDots,
  left: rightHandDots.map(dot => ({
    index: dot.index + 5,
    top: dot.top,
    left: `${100 - parseFloat(dot.left)}%`,
  })),
};

const fingerNames = {
  0: "Right Thumb",
  1: "Right Index",
  2: "Right Middle",
  3: "Right Ring",
  4: "Right Little",
  5: "Left Thumb",
  6: "Left Index",
  7: "Left Middle",
  8: "Left Ring",
  9: "Left Little",
};

function App() {
  const [deviceStatus, setDeviceStatus] = useState('');
  const [deviceInfo, setDeviceInfo] = useState('');
  const [imageBase64, setImageBase64] = useState('');
  const [initError, setInitError] = useState(null);
  const [fingerData, setFingerData] = useState(null);
  const [loading, setLoading] = useState({ deviceInfo: false, initialize: false, capture: false });
  const [hand, setHand] = useState("right"); // State for selected hand
  const [selectedFinger, setSelectedFinger] = useState(null);

  const [cnic, setCnic] = useState("");
  const [cnicError, setCnicError] = useState("");
  const [mobile, setMobile] = useState("");
  const [mobileError, setMobileError] = useState("");
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  const handleFingerClick = (index) => {
    setSelectedFinger(index);
    alert(`Finger index selected: ${index}`);
  };

  // Dynamically calculate the finger position based on the image size
  const handleResize = () => {
    const imageContainer = document.getElementById("handImageContainer");
    const { width, height } = imageContainer.getBoundingClientRect();
    setImageSize({ width, height });
  };

  // Detect window resize and adjust dot positions
  useEffect(() => {
    handleResize(); // Initial size calculation
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getDeviceInfo = () => {
    setLoading(l => ({ ...l, deviceInfo: true }));
    setDeviceInfo('');
    setDeviceStatus('');
    setInitError(null);
    setFingerData(null);
    setImageBase64('');
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
    setLoading(l => ({ ...l, deviceInfo: false }));
  };

  const initializeDevice = () => {
    setLoading(l => ({ ...l, initialize: true }));
    setInitError(null);
    setDeviceInfo('');
    setDeviceStatus('');
    setFingerData(null);
    setImageBase64('');
    if (window.Fingerprint && typeof window.Fingerprint.initializeDevice === 'function') {
      try {
        let response = window.Fingerprint.initializeDevice();
        response = JSON.parse(response);
        if (response?.code !== 0) {
          setDeviceStatus(response?.message || 'Error initializing device.');
          setInitError(response);
          setLoading(l => ({ ...l, initialize: false }));
          return;
        }
        setDeviceStatus('Device initialized!');
      } catch {
        setDeviceStatus('Error initializing device.');
        setInitError({ message: 'Error initializing device.' });
      }
    } else {
      setDeviceStatus('Fingerprint API not available.');
      setInitError({ message: 'Fingerprint API not available.' });
    }
    setLoading(l => ({ ...l, initialize: false }));
  };

  const capture = () => {
    setLoading(l => ({ ...l, capture: true }));
    setDeviceInfo('');
    setDeviceStatus('');
    setInitError(null);
    setFingerData(null);
    setImageBase64('');
    if (window.Fingerprint && typeof window.Fingerprint.captureFingerprint === 'function') {
      try {
        const result = window.Fingerprint.captureFingerprint("Timeout=10000&Quality=50&licstr=&templateFormat=ISO&imageWSQRate=0.75");
        let parsed = null;
        if (typeof result === 'string' && result != null) {
          try {
            parsed = JSON.parse(result);
            if(parsed?.data?.ImageDataBase64) {
              setImageBase64(parsed.data.ImageDataBase64);
            }
          } catch {
            setDeviceStatus('Capture returned invalid JSON.');
            setFingerData(null);
            setLoading(l => ({ ...l, capture: false }));
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
    setLoading(l => ({ ...l, capture: false }));
  };

  useEffect(() => {
    initializeDevice();
  }, []);

  const handleCnicChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    setCnic(value);
    if (value.length !== 13 && value.length !== 0) {
      setCnicError("CNIC must be exactly 13 digits");
    } else {
      setCnicError("");
    }
  };

  const handleMobileChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    setMobile(value);
    if (value.length === 0) {
      setMobileError("");
    } else if (!value.startsWith("03")) {
      setMobileError("Mobile number must start with 03");
    } else if (value.length !== 11) {
      setMobileError("Mobile number must be exactly 11 digits");
    } else {
      setMobileError("");
    }
  };

  const handleCnicSubmit = (e) => {
    e.preventDefault();
    let hasError = false;

    if (cnic.length !== 13) {
      setCnicError("CNIC must be exactly 13 digits");
      hasError = true;
    } else {
      setCnicError("");
    }

    if (mobile.length === 0) {
      setMobileError("Mobile number is required");
      hasError = true;
    } else if (!mobile.startsWith("03")) {
      setMobileError("Mobile number must start with 03");
      hasError = true;
    } else if (mobile.length !== 11) {
      setMobileError("Mobile number must be exactly 11 digits");
      hasError = true;
    } else {
      setMobileError("");
    }

    if (!selectedFinger && selectedFinger !== 0) {
      alert("Please select a finger");
      hasError = true;
    }

    if (hasError) return;

    alert(`CNIC: ${cnic}\nMobile: ${mobile}\nFinger: ${fingerNames[selectedFinger]}`);
  };

  return (
    <>
      <div style={{ maxWidth: 420, margin: "2rem auto", padding: "24px", border: "1px solid #ddd", borderRadius: 12, boxShadow: "0 4px 16px rgba(0,0,0,0.1)", background: "#fff" }}>
        <h2 style={{ textAlign: "center", color: "#333", marginBottom: "24px", fontSize: "24px" }}>NADRA Verification</h2>
        <form onSubmit={handleCnicSubmit}>
          {/* CNIC Field */}
          <div style={{ marginBottom: "16px" }}>
            <label htmlFor="cnic" style={{ display: "block", marginBottom: "6px", fontWeight: 500, color: "#555" }}>CNIC (13 digits):</label>
            <input
              type="text"
              id="cnic"
              name="cnic"
              value={cnic}
              onChange={handleCnicChange}
              maxLength={13}
              placeholder="3520212345678"
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #ccc", borderRadius: 6, fontSize: "14px", boxSizing: "border-box" }}
              autoComplete="off"
            />
            {cnicError && <div style={{ color: "#e53935", fontSize: "13px", marginTop: "4px" }}>{cnicError}</div>}
          </div>

          {/* Mobile Number Field */}
          <div style={{ marginBottom: "20px" }}>
            <label htmlFor="mobile" style={{ display: "block", marginBottom: "6px", fontWeight: 500, color: "#555" }}>Mobile Number (11 digits):</label>
            <input
              type="text"
              id="mobile"
              name="mobile"
              value={mobile}
              onChange={handleMobileChange}
              maxLength={11}
              placeholder="03001234567"
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #ccc", borderRadius: 6, fontSize: "14px", boxSizing: "border-box" }}
              autoComplete="off"
            />
            {mobileError && <div style={{ color: "#e53935", fontSize: "13px", marginTop: "4px" }}>{mobileError}</div>}
          </div>

          {/* Finger Selection Section */}
          <div style={{ margin: "20px 0", padding: "20px", borderRadius: 10, background: "#f9f9f9", border: "1px solid #eee" }}>
            <h3 style={{ textAlign: "center", marginBottom: "12px", fontSize: "18px", color: "#333" }}>Select Finger</h3>
            <p style={{ textAlign: "center", fontSize: "13px", color: "#666", marginBottom: "16px" }}>Choose hand and tap the finger to scan</p>
            <div style={{ display: "flex", justifyContent: "center", gap: 24, marginBottom: 16, fontSize: 14 }}>
              <label>
                <input
                  type="radio"
                  name="hand"
                  checked={hand === "right"}
                  onChange={() => {
                    setHand("right");
                    setSelectedFinger(null);
                  }}
                />{" "}
                Right Hand
              </label>
              <label>
                <input
                  type="radio"
                  name="hand"
                  checked={hand === "left"}
                  onChange={() => {
                    setHand("left");
                    setSelectedFinger(null);
                  }}
                />{" "}
                Left Hand
              </label>
            </div>

            <div
              id="handImageContainer"
              style={{
                position: "relative",
                width: "100%",
                maxWidth: 260,
                margin: "0 auto",
              }}
            >
              <img
                src={hand === "right" ? RightHand : LeftHand}
                alt={`${hand} hand`}
                style={{ width: "100%", height: "auto", display: "block" }}
              />

              {fingerDots[hand].map((finger) => {
                const isSelected = selectedFinger === finger.index;

                return (
                  <button
                    key={finger.index}
                    onClick={() => handleFingerClick(finger.index)}
                    style={{
                      position: "absolute",
                      top: finger.top,
                      left: finger.left,
                      transform: "translate(-50%, -50%)",
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      backgroundColor: isSelected ? "#00c853" : "#e53935",
                      border: "2px solid #fff",
                      boxShadow: isSelected
                        ? "0 0 0 6px rgba(0,200,83,0.25)"
                        : "0 0 0 4px rgba(229,57,53,0.25)",
                      cursor: "pointer",
                      padding: 8,
                    }}
                    aria-label={fingerNames[finger.index]}
                  />
                );
              })}
            </div>

            {selectedFinger !== null && (
              <div style={{ marginTop: 12, textAlign: "center", fontSize: 14, fontWeight: 600, color: "#00c853" }}>
                ✓ {fingerNames[selectedFinger]}
              </div>
            )}
          </div>

          <button 
            type="submit" 
            disabled={cnic.length !== 13 || mobile.length !== 11 || !mobile.startsWith("03") || selectedFinger === null}
            style={{ 
              width: "100%", 
              padding: "12px", 
              background: (cnic.length === 13 && mobile.length === 11 && mobile.startsWith("03") && selectedFinger !== null) ? "#007bff" : "#ccc", 
              color: "#fff", 
              border: "none", 
              borderRadius: 6, 
              fontSize: "16px", 
              fontWeight: 600, 
              cursor: (cnic.length === 13 && mobile.length === 11 && mobile.startsWith("03") && selectedFinger !== null) ? "pointer" : "not-allowed",
              transition: "background 0.2s"
            }}
          >
            Submit

          </button>
        </form>
      </div>
    </>
  );
}

export default App;
