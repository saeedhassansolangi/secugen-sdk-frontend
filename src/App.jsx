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

// finger_map = {
//         1: "RIGHT_THUMB",
//         2: "RIGHT_INDEX",
//         3: "RIGHT_MIDDLE",
//         4: "RIGHT_RING",
//         5: "RIGHT_LITTLE",
//         6: "LEFT_THUMB",
//         7: "LEFT_INDEX",
//         8: "LEFT_MIDDLE",
//         9: "LEFT_RING",
//        10: "LEFT_LITTLE"
// }

const fingerNames = {
  1: "Right Thumb",
  2: "Right Index",
  3: "Right Middle",
  4: "Right Ring",
  5: "Right Little",
  6: "Left Thumb",
  7: "Left Index",
  8: "Left Middle",
  9: "Left Ring",
  10: "Left Little",
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
  const [capturedFingerprint, setCapturedFingerprint] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'capture', 'success', or 'error'
  const [modalMessage, setModalMessage] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFingerClick = async (index) => {
    setSelectedFinger(index);
    setIsCapturing(true);
    
    // Call capture function
    if (window.Fingerprint && typeof window.Fingerprint.captureFingerprint === 'function') {
      try {
        const result = window.Fingerprint.captureFingerprint("Timeout=10000&Quality=50&licstr=&templateFormat=ISO&imageWSQRate=0.75");
        let parsed = null;
        if (typeof result === 'string' && result != null) {
          try {
            parsed = JSON.parse(result);
            if(parsed?.data?.ImageDataBase64) {
              setCapturedFingerprint(parsed.data.ImageDataBase64);
              setModalType('capture');
              setShowModal(true);
            } else {
              setModalType('error');
              setModalMessage('Failed to capture fingerprint image');
              setShowModal(true);
            }
          } catch {
            setModalType('error');
            setModalMessage('Invalid response from fingerprint device');
            setShowModal(true);
          }
        } else if (typeof result === 'object' && result !== null) {
          parsed = result;
          if(parsed?.data?.ImageDataBase64) {
            setCapturedFingerprint(parsed.data.ImageDataBase64);
            setModalType('capture');
            setShowModal(true);
          }
        }
      } catch (error) {
        setModalType('error');
        setModalMessage('Error capturing fingerprint');
        setShowModal(true);
      }
    } else {
      setModalType('error');
      setModalMessage('Fingerprint device not available');
      setShowModal(true);
    }
    setIsCapturing(false);
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
    if (value.length === 0) {
      setCnicError("CNIC is required");
    } else if(value.startsWith("0")) {
      setCnicError("CNIC cannot start with 0");
    }else if(value.length !== 13) {
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

  const handleCnicSubmit = async (e) => {
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
      setModalType('error');
      setModalMessage('Please select a finger');
      setShowModal(true);
      hasError = true;
    }

    if (!capturedFingerprint) {
      setModalType('error');
      setModalMessage('Please capture fingerprint first');
      setShowModal(true);
      hasError = true;
    }

    if (hasError) return;

    // Show the modal with captured fingerprint for verification
    setModalType('capture');
    setShowModal(true);
  };

  return (
    <>
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", padding: "20px 10px" }}>
      <div style={{ maxWidth: 440, margin: "0 auto", padding: "32px", background: "#fff", borderRadius: 20, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h2 style={{ color: "#2d3748", marginBottom: "8px", fontSize: "28px", fontWeight: "700", letterSpacing: "-0.5px" }}>NADRA Verification</h2>
          <p style={{ color: "#718096", fontSize: "14px" }}>Complete the form to verify your identity</p>
        </div>
        <form onSubmit={handleCnicSubmit}>
          {/* CNIC Field */}
          <div style={{ marginBottom: "20px" }}>
            <label htmlFor="cnic" style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#2d3748", fontSize: "14px" }}>CNIC Number</label>
            <input
              type="text"
              id="cnic"
              name="cnic"
              value={cnic}
              onChange={handleCnicChange}
              maxLength={13}
              placeholder="3520212345678"
              style={{ width: "100%", padding: "12px 16px", border: cnicError ? "2px solid #e53935" : "2px solid #e2e8f0", borderRadius: 10, fontSize: "15px", boxSizing: "border-box", transition: "all 0.3s", outline: "none", background: "#f7fafc" }}
              autoComplete="off"
              onFocus={(e) => e.target.style.border = "2px solid #667eea"}
              onBlur={(e) => e.target.style.border = cnicError ? "2px solid #e53935" : "2px solid #e2e8f0"}
            />
            {cnicError && <div style={{ color: "#e53935", fontSize: "12px", marginTop: "6px", display: "flex", alignItems: "center", gap: "4px" }}>⚠️ {cnicError}</div>}
          </div>

          {/* Mobile Number Field */}
          <div style={{ marginBottom: "24px" }}>
            <label htmlFor="mobile" style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#2d3748", fontSize: "14px" }}>Mobile Number</label>
            <input
              type="text"
              id="mobile"
              name="mobile"
              value={mobile}
              onChange={handleMobileChange}
              maxLength={11}
              placeholder="03001234567"
              style={{ width: "100%", padding: "12px 16px", border: mobileError ? "2px solid #e53935" : "2px solid #e2e8f0", borderRadius: 10, fontSize: "15px", boxSizing: "border-box", transition: "all 0.3s", outline: "none", background: "#f7fafc" }}
              autoComplete="off"
              onFocus={(e) => e.target.style.border = "2px solid #667eea"}
              onBlur={(e) => e.target.style.border = mobileError ? "2px solid #e53935" : "2px solid #e2e8f0"}
            />
            {mobileError && <div style={{ color: "#e53935", fontSize: "12px", marginTop: "6px", display: "flex", alignItems: "center", gap: "4px" }}>⚠️ {mobileError}</div>}
          </div>

          {/* Finger Selection Section */}
          <div style={{ margin: "24px 0", padding: "24px", borderRadius: 16, background: "linear-gradient(135deg, #f6f8fb 0%, #e9ecf1 100%)", border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
            <h3 style={{ textAlign: "center", marginBottom: "8px", fontSize: "18px", color: "#2d3748", fontWeight: "700" }}>Select Finger</h3>
            <p style={{ textAlign: "center", fontSize: "13px", color: "#718096", marginBottom: "20px" }}>Choose hand and tap the finger to scan</p>
            <div style={{ display: "flex", justifyContent: "center", gap: 20, marginBottom: 20, fontSize: 14 }}>
              <label style={{ cursor: "pointer", padding: "8px 16px", background: hand === "right" ? "#667eea" : "#fff", color: hand === "right" ? "#fff" : "#4a5568", borderRadius: 8, fontWeight: 500, transition: "all 0.3s", border: "2px solid #667eea" }}>
                <input
                  type="radio"
                  name="hand"
                  checked={hand === "right"}
                  onChange={() => {
                    setHand("right");
                    setSelectedFinger(null);
                  }}
                  style={{ marginRight: 6 }}
                />
                Right Hand
              </label>
              <label style={{ cursor: "pointer", padding: "8px 16px", background: hand === "left" ? "#667eea" : "#fff", color: hand === "left" ? "#fff" : "#4a5568", borderRadius: 8, fontWeight: 500, transition: "all 0.3s", border: "2px solid #667eea" }}>
                <input
                  type="radio"
                  name="hand"
                  checked={hand === "left"}
                  onChange={() => {
                    setHand("left");
                    setSelectedFinger(null);
                  }}
                  style={{ marginRight: 6 }}
                />
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
                      backgroundColor: isSelected ? "#48bb78" : "#667eea",
                      border: "3px solid #fff",
                      boxShadow: isSelected
                        ? "0 0 0 6px rgba(72,187,120,0.3), 0 4px 12px rgba(72,187,120,0.4)"
                        : "0 0 0 4px rgba(102,126,234,0.2), 0 2px 8px rgba(102,126,234,0.3)",
                      cursor: "pointer",
                      padding: 8,
                      transition: "all 0.3s",
                    }}
                    aria-label={fingerNames[finger.index]}
                  />
                );
              })}
            </div>

            {selectedFinger !== null && (
              <div style={{ marginTop: 16, textAlign: "center", fontSize: 15, fontWeight: 600, color: "#48bb78", padding: "10px", background: "rgba(72,187,120,0.1)", borderRadius: 8, border: "1px solid rgba(72,187,120,0.3)" }}>
                ✓ {fingerNames[selectedFinger]} Selected
              </div>
            )}
          </div>

          <button 
            type="submit" 
            disabled={cnic.length !== 13 || mobile.length !== 11 || !mobile.startsWith("03") || selectedFinger === null || !capturedFingerprint || isSubmitting}
            style={{ 
              width: "100%", 
              padding: "14px", 
              background: (cnic.length === 13 && mobile.length === 11 && mobile.startsWith("03") && selectedFinger !== null && capturedFingerprint && !isSubmitting) ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" : "#cbd5e0", 
              color: "#fff", 
              border: "none", 
              borderRadius: 12, 
              fontSize: "16px", 
              fontWeight: 700, 
              cursor: (cnic.length === 13 && mobile.length === 11 && mobile.startsWith("03") && selectedFinger !== null && capturedFingerprint && !isSubmitting) ? "pointer" : "not-allowed",
              transition: "all 0.3s",
              boxShadow: (cnic.length === 13 && mobile.length === 11 && mobile.startsWith("03") && selectedFinger !== null && capturedFingerprint && !isSubmitting) ? "0 8px 20px rgba(102,126,234,0.4)" : "none",
              letterSpacing: "0.5px"
            }}
            onMouseEnter={(e) => {
              if (cnic.length === 13 && mobile.length === 11 && mobile.startsWith("03") && selectedFinger !== null) {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 12px 28px rgba(102,126,234,0.5)";
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = (cnic.length === 13 && mobile.length === 11 && mobile.startsWith("03") && selectedFinger !== null) ? "0 8px 20px rgba(102,126,234,0.4)" : "none";
            }}
          >
            Verify & Submit
          </button>
        </form>
      </div>
      </div>

      {/* Modal for captured fingerprint and success */}
      {showModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={() => setShowModal(false)}
        >
          <div 
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: '32px',
              maxWidth: 500,
              width: '100%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowModal(false)}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                background: 'transparent',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#718096',
                padding: '4px 8px'
              }}
            >
              ×
            </button>

            {modalType === 'capture' && capturedFingerprint && (
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ marginBottom: '20px', color: '#2d3748', fontSize: '22px', fontWeight: 700 }}>Fingerprint Captured</h3>
                <div style={{ 
                  border: '2px solid #e2e8f0', 
                  borderRadius: 12, 
                  padding: '16px', 
                  background: '#f7fafc',
                  marginBottom: '20px'
                }}>
                  <img 
                    src={`data:image/png;base64,${capturedFingerprint}`} 
                    alt="Captured Fingerprint" 
                    style={{ 
                      maxWidth: '100%', 
                      height: 'auto',
                      borderRadius: 8
                    }} 
                  />
                </div>
                <p style={{ color: '#718096', marginBottom: '20px', fontSize: '14px' }}>Fingerprint captured successfully. Verify and submit to continue.</p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <button
                    onClick={async () => {
                      setShowModal(false);
                      setIsSubmitting(true);
                      
                      try {
                        const payload = {
                          Thumb: capturedFingerprint,
                          cnic_number: cnic,
                          IndexNumber: String(selectedFinger),
                          mobileNo: mobile,
                          areaName: "Sindh",
                          channelCode: "00"
                        };

                        alert("Making API Call with payload:\n" + JSON.stringify(payload, null, 2));


                        const response = await fetch('http://10.0.150.83:7075/FIngerExtract', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify(payload),
                        });

                        const data = await response.json();

                        if (response.ok) {
                          setModalType('success');
                          setShowModal(true);
                        } else {
                          setModalType('error');
                          setModalMessage(`API Error: ${data.message || 'Verification failed'}`);
                          setShowModal(true);
                        }
                      } catch (error) {
                        setModalType('error');
                        // alert("Error, )
                        // setModalMessage(`Network Error: ${error.message}`);
                        setModalMessage(JSON.stringify(error));
                        setShowModal(true);
                      } finally {
                        setIsSubmitting(false);
                      }
                    }}
                    disabled={!cnic || cnic.length !== 13 || !mobile || mobile.length !== 11}
                    style={{
                      padding: '10px 24px',
                      background: (cnic && cnic.length === 13 && mobile && mobile.length === 11) 
                        ? 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)' 
                        : '#cbd5e0',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: '15px',
                      fontWeight: 600,
                      cursor: (cnic && cnic.length === 13 && mobile && mobile.length === 11) ? 'pointer' : 'not-allowed',
                      boxShadow: (cnic && cnic.length === 13 && mobile && mobile.length === 11) 
                        ? '0 4px 12px rgba(72,187,120,0.4)' 
                        : 'none'
                    }}
                  >
                     Submit
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    style={{
                      padding: '10px 24px',
                      background: '#718096',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: '15px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(113,128,150,0.4)'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {modalType === 'error' && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  fontSize: '60px', 
                  marginBottom: '20px',
                  color: '#e53935'
                }}>⚠️</div>
                <h3 style={{ marginBottom: '16px', color: '#2d3748', fontSize: '24px', fontWeight: 700 }}>Error</h3>
                <p style={{ color: '#718096', marginBottom: '24px', fontSize: '15px' }}>{modalMessage}</p>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '12px 32px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: '16px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(102,126,234,0.4)'
                  }}
                >
                  OK
                </button>
              </div>
            )}

            {modalType === 'success' && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  fontSize: '60px', 
                  marginBottom: '20px',
                  color: '#48bb78'
                }}>✓</div>
                <h3 style={{ marginBottom: '16px', color: '#2d3748', fontSize: '24px', fontWeight: 700 }}>Verification Successful!</h3>
                <p style={{ color: '#718096', marginBottom: '24px', fontSize: '15px' }}>Your NADRA verification has been completed successfully.</p>
                <div style={{
                  background: '#f0fff4',
                  border: '1px solid #9ae6b4',
                  borderRadius: 8,
                  padding: '12px',
                  marginBottom: '24px',
                  textAlign: 'left'
                }}>
                  <p style={{ margin: '4px 0', fontSize: '14px', color: '#2d3748' }}><strong>CNIC:</strong> {cnic}</p>
                  <p style={{ margin: '4px 0', fontSize: '14px', color: '#2d3748' }}><strong>Mobile:</strong> {mobile}</p>
                  <p style={{ margin: '4px 0', fontSize: '14px', color: '#2d3748' }}><strong>Finger:</strong> {fingerNames[selectedFinger]}</p>
                </div>
                <button
                  onClick={() => {
                    setShowModal(false);
                    // Reset form if needed
                    // setCnic("");
                    // setMobile("");
                    // setSelectedFinger(null);
                    // setCapturedFingerprint(null);
                  }}
                  style={{
                    padding: '12px 32px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: '16px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(102,126,234,0.4)'
                  }}
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* {(isCapturing || isSubmitting) && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          flexDirection: 'column'
        }}>
          <div style={{
            width: 50,
            height: 50,
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ color: '#fff', marginTop: 16, fontSize: 16 }}>
            {isCapturing ? 'Capturing fingerprint...' : 'Submitting verification...'}
          </p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )} */}
    </>
  );
}

export default App;
