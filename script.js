document.addEventListener('DOMContentLoaded', () => {
    // Element getters
    const mainContentArea = document.querySelector('.main-content-area');
    const drawButton = document.getElementById('draw-button');
    const winnerDisplay = document.getElementById('winner-display');
    const nameListInput = document.getElementById('name-list-input');
    const removeWinnerToggle = document.getElementById('remove-winner-toggle');
    const soundToggle = document.getElementById('sound-toggle');
    const drawDurationInput = document.getElementById('draw-duration-input');

    const settingsToggleButton = document.getElementById('settings-toggle-button');
    const settingsSection = document.getElementById('settings-section');
    const saveSettingsButton = document.getElementById('save-settings-button');

    const confettiContainer = document.getElementById('confetti-container');

    const themeSelect = document.getElementById('theme-select');
    const backgroundImageUpload = document.getElementById('background-image-upload');
    const clearBackgroundButton = document.getElementById('clear-background-button');

    const winnerTextColorPicker = document.getElementById('winner-text-color-picker');
    const winnerFontSizeInput = document.getElementById('winner-font-size-input');

    const clearWinnerButton = document.getElementById('clear-winner-button');

    // New Element Getters for Advanced Settings
    const advancedSettingsToggle = document.getElementById('advanced-settings-toggle');
    const advancedSettingsContent = document.getElementById('advanced-settings-content');
    const alwaysWinNamesInput = document.getElementById('always-win-names-input');


    // State variables
    let names = []; // Main list of names
    let currentTheme = 'red';
    let currentBackgroundImage = null;
    let currentWinnerBorderColor = '#FFD700'; // Kept variable, but not used for border style anymore
    let currentWinnerTextColor = '#333333';
    let currentDrawDuration = 5000;
    let currentWinnerFontSize = '80px'; // Default font size in px

    // New State variables for Advanced Settings
    let advancedSettingsEnabled = false;
    let alwaysWinNames = []; // List of names that should always win


    let isDrawing = false;
    let drawInterval;
    let drawTimeout;
    let audioCtx = null;
    let userInteracted = false;
    let winSoundAudio = null;

    // --- Sound Context Initialization ---
    function initAudioContext() {
        if (!userInteracted && !audioCtx && (window.AudioContext || window.webkitAudioContext)) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            if (audioCtx.state === 'suspended') {
                audioCtx.resume().then(() => {
                    console.log("AudioContext resumed successfully.");
                    if (audioCtx.state === 'running') preloadWinSound();
                }).catch(e => console.error("Error resuming AudioContext:", e));
            } else if (audioCtx.state === 'running') {
                preloadWinSound();
            }
            console.log("AudioContext initialized. State:", audioCtx.state);
        }
        userInteracted = true;
    }

    function preloadWinSound() {
        if (!winSoundAudio && soundToggle && soundToggle.checked) {
            console.log("Preloading win.mp3...");
            winSoundAudio = new Audio('win.mp3');
            winSoundAudio.preload = 'auto';
            winSoundAudio.load();
            winSoundAudio.addEventListener('canplaythrough', () => {
                console.log("win.mp3 can play through.");
            });
            winSoundAudio.addEventListener('error', (e) => {
                console.error("Error loading win.mp3:", e);
                winSoundAudio = null;
            });
        }
    }

    function firstInteractionListener() {
        initAudioContext();
    }
    document.body.addEventListener('click', firstInteractionListener, { once: true });
    document.body.addEventListener('keydown', firstInteractionListener, { once: true });


    function playTickSound() {
        if (!soundToggle || !soundToggle.checked || !audioCtx || audioCtx.state !== 'running') return;
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.05);
    }

    function playWinSound() {
        if (!soundToggle || !soundToggle.checked) return;
        if (audioCtx && audioCtx.state === 'suspended' && userInteracted) {
            audioCtx.resume().then(() => {
                if (audioCtx.state === 'running') attemptPlayWinSoundFile();
            }).catch(e => console.error("Error resuming audio context for win sound:", e));
            return;
        }
        attemptPlayWinSoundFile();
    }

    function attemptPlayWinSoundFile() {
        if (winSoundAudio) {
            winSoundAudio.currentTime = 0;
            winSoundAudio.play().then(() => {
                console.log("Playing win.mp3");
            }).catch(error => {
                console.error("Error playing win.mp3:", error);
                playGeneratedWinSoundFallback();
            });
        } else if (soundToggle && soundToggle.checked) {
            console.warn("win.mp3 not loaded or error, playing generated win sound as fallback.");
            playGeneratedWinSoundFallback();
        }
    }

    function playGeneratedWinSoundFallback() {
        if (!audioCtx || audioCtx.state !== 'running') {
            console.warn("Cannot play generated win sound: AudioContext not running.");
            return;
        }
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = 'triangle';
        gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
        const now = audioCtx.currentTime;
        oscillator.frequency.setValueAtTime(440, now);
        oscillator.frequency.linearRampToValueAtTime(659.25, now + 0.1);
        oscillator.frequency.linearRampToValueAtTime(880, now + 0.2);
        oscillator.start(now);
        oscillator.stop(now + 0.3);
    }


    function applyTheme(themeName) {
        if (!mainContentArea) { console.error("applyTheme: mainContentArea not found!"); return; }
        // Remove all existing theme classes
        mainContentArea.classList.remove(
            'theme-red',
            'theme-jshine',
            'theme-coolsky',
            'theme-megatron',
            'theme-eveningsunshine',
            'theme-memariani',
            'theme-bydesign',
            'theme-magic',
            'theme-sublimelight'
        );
        const themeToApply = themeName || 'red';
        // Add the new theme class
        mainContentArea.classList.add(`theme-${themeToApply.toLowerCase()}`);
        currentTheme = themeToApply;
    }

    function applyBackgroundImage(imageUrl) {
        if (!mainContentArea) { console.error("applyBackgroundImage: mainContentArea not found!"); return; }
        mainContentArea.style.setProperty('--custom-background-image', imageUrl ? `url(${imageUrl})` : 'initial');
        currentBackgroundImage = imageUrl;
    }

    // Function to apply border color, text color, and font size
    function applyWinnerStyles(borderColor, textColor, fontSize) {
        if (!mainContentArea) { console.error("applyWinnerStyles: mainContentArea not found!"); return; }
        // This sets the CSS variable, but the border property using it is commented out in CSS
        mainContentArea.style.setProperty('--winner-border-color', borderColor);
        mainContentArea.style.setProperty('--winner-text-color', textColor);
        mainContentArea.style.setProperty('--winner-font-size', fontSize); // Apply font size
        currentWinnerBorderColor = borderColor; // Keep state updated even if not used for border
        currentWinnerTextColor = textColor;
        currentWinnerFontSize = fontSize; // Update state variable
    }

    function toggleSettingsSection() {
        if (!settingsSection || !advancedSettingsToggle || !advancedSettingsContent) {
            console.error("toggleSettingsSection: One or more settings elements are missing!");
            return;
        }
        const isActive = settingsSection.classList.toggle('active');
        console.log("Settings section toggled. Active:", isActive);
        if (isActive) {
            // Populate main settings
            if(nameListInput) nameListInput.value = names.join('\n');
            if(themeSelect) themeSelect.value = currentTheme;
            if(winnerTextColorPicker) winnerTextColorPicker.value = currentWinnerTextColor;
            if(winnerFontSizeInput) {
                const sizeValue = parseInt(currentWinnerFontSize, 10);
                if (!isNaN(sizeValue)) {
                    winnerFontSizeInput.value = sizeValue;
                }
            }
            if(removeWinnerToggle) removeWinnerToggle.checked = localStorage.getItem('luckyDrawRemoveWinner') !== 'false';
            if(soundToggle) soundToggle.checked = localStorage.getItem('luckyDrawEnableSound') !== 'false';
            if(drawDurationInput) drawDurationInput.value = currentDrawDuration / 1000;

            // Populate advanced settings
            advancedSettingsEnabled = localStorage.getItem('luckyDrawAdvancedEnabled') === 'true'; // Load state correctly
            advancedSettingsToggle.checked = advancedSettingsEnabled;
            const savedAlwaysWinNames = localStorage.getItem('luckyDrawAlwaysWinNames'); // Load names correctly
            if (savedAlwaysWinNames) { try { alwaysWinNames = JSON.parse(savedAlwaysWinNames); } catch(e){ alwaysWinNames = []; console.error("Error parsing always win names from LS", e);}}
            else { alwaysWinNames = []; }
            if (alwaysWinNamesInput) alwaysWinNamesInput.value = alwaysWinNames.join('\n');

            // Apply display style based on advanced settings toggle state
            if (advancedSettingsEnabled) {
                advancedSettingsContent.style.display = 'block';
            } else {
                advancedSettingsContent.style.display = 'none';
            }

        }
    }

    function saveSettings() {
        console.log("Saving settings...");
        if (!nameListInput || !removeWinnerToggle || !soundToggle || !themeSelect ||
            !winnerTextColorPicker || !backgroundImageUpload || !drawDurationInput || !winnerFontSizeInput ||
            !advancedSettingsToggle || !alwaysWinNamesInput) { // Added checks for new elements
            console.error("saveSettings: One or more critical settings input elements are missing from the DOM!");
            alert("Error: A settings control element is missing. Cannot save. Please check console.");
            return;
        }

        names = nameListInput.value.split('\n').map(name => name.trim()).filter(name => name.length > 0);
        localStorage.setItem('luckyDrawNames', JSON.stringify(names));

        const soundEnabledSetting = soundToggle.checked;
        localStorage.setItem('luckyDrawEnableSound', soundEnabledSetting);
        if (soundEnabledSetting && !winSoundAudio && audioCtx && audioCtx.state === 'running') {
            preloadWinSound();
        }
        localStorage.setItem('luckyDrawRemoveWinner', removeWinnerToggle.checked);

        applyTheme(themeSelect.value);
        localStorage.setItem('luckyDrawTheme', currentTheme);

        // Get and validate font size
        const fontSizeValue = parseInt(winnerFontSizeInput.value, 10);
        let newFontSize = currentWinnerFontSize; // Default to current if input is invalid
        // Updated validation to check against 200
        if (!isNaN(fontSizeValue) && fontSizeValue >= parseInt(winnerFontSizeInput.min) && fontSizeValue <= 200) {
             newFontSize = `${fontSizeValue}px`;
             localStorage.setItem('luckyDrawWinnerFontSize', newFontSize);
        } else {
            // Updated alert message
            alert(`Invalid font size (${winnerFontSizeInput.min}-200 px). Using previous value.`);
            if(winnerFontSizeInput) {
                 const currentSizePx = parseInt(currentWinnerFontSize, 10);
                 if (!isNaN(currentSizePx)) winnerFontSizeInput.value = currentSizePx;
            }
        }

        // Apply colors and font size (border color is no longer a setting)
        applyWinnerStyles(
            currentWinnerBorderColor, // Keep the variable but it's not used for border now
            winnerTextColorPicker.value,
            newFontSize // Pass the potentially new font size
        );
        localStorage.setItem('luckyDrawWinnerTextColor', currentWinnerTextColor);


        const durationSeconds = parseInt(drawDurationInput.value, 10);
        if (!isNaN(durationSeconds) && durationSeconds >= 1 && durationSeconds <= 30) {
            currentDrawDuration = durationSeconds * 1000;
            localStorage.setItem('luckyDrawDuration', currentDrawDuration.toString());
        } else {
            alert("Invalid draw duration (1-30s). Using previous value.");
            if(drawDurationInput) drawDurationInput.value = currentDrawDuration / 1000;
        }

        // Save Advanced Settings
        advancedSettingsEnabled = advancedSettingsToggle.checked;
        localStorage.setItem('luckyDrawAdvancedEnabled', advancedSettingsEnabled);

        alwaysWinNames = alwaysWinNamesInput.value.split('\n').map(name => name.trim()).filter(name => name.length > 0);
        localStorage.setItem('luckyDrawAlwaysWinNames', JSON.stringify(alwaysWinNames));

        // Apply display style for advanced settings based on saved state
        if (advancedSettingsEnabled) {
            if(advancedSettingsContent) advancedSettingsContent.style.display = 'block';
        } else {
            if(advancedSettingsContent) advancedSettingsContent.style.display = 'none';
        }


        const file = backgroundImageUpload.files[0];
        const finalizeSave = () => {
            updateDrawButtonState();
            if (winnerDisplay) {
                 // If advanced settings are enabled and there are always win names, clear the display initially
                if (advancedSettingsEnabled && alwaysWinNames.length > 0) {
                     winnerDisplay.textContent = '';
                }
                 // Otherwise, handle the standard empty state messages
                else if (names.length === 0 && !isDrawing) {
                    winnerDisplay.textContent = "Add names in settings!";
                } else if (!isDrawing && (winnerDisplay.textContent === "Add names in settings!" || winnerDisplay.textContent === "All names drawn!" || winnerDisplay.textContent === "" ) ) {
                     if(names.length > 0 && winnerDisplay.textContent !== "") {
                        winnerDisplay.textContent = "";
                     } else if (names.length === 0) {
                        winnerDisplay.textContent = "Add names in settings!";
                     }
                }
            }
            alert("Settings saved!");
        };

        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                applyBackgroundImage(e.target.result);
                localStorage.setItem('luckyDrawBgImage', currentBackgroundImage);
                finalizeSave();
            };
            reader.onerror = (e) => {
                console.error("Error reading background image file.", e);
                alert("Error processing image.");
                applyBackgroundImage(null);
                localStorage.removeItem('luckyDrawBgImage');
                finalizeSave();
            };
            reader.readAsDataURL(file);
        } else {
            if (backgroundImageUpload.value === "") {
                if (currentBackgroundImage || localStorage.getItem('luckyDrawBgImage')) {
                    applyBackgroundImage(null);
                    localStorage.removeItem('luckyDrawBgImage');
                }
            }
            finalizeSave();
        }
    }

    function loadSettings() {
        console.log("Loading settings...");
        const savedNames = localStorage.getItem('luckyDrawNames');
        if (savedNames) { try { names = JSON.parse(savedNames); } catch(e){ names = []; console.error("Error parsing names from LS", e);}}
        else { names = []; }

        if(nameListInput) nameListInput.value = names.join('\n');
        if(removeWinnerToggle) removeWinnerToggle.checked = localStorage.getItem('luckyDrawRemoveWinner') !== 'false';
        if(soundToggle) {
            soundToggle.checked = localStorage.getItem('luckyDrawEnableSound') !== 'false';
            if (soundToggle.checked && audioCtx && audioCtx.state === 'running' && !winSoundAudio) {
                preloadWinSound();
            }
        }

        applyTheme(localStorage.getItem('luckyDrawTheme') || 'red');
        if(themeSelect) themeSelect.value = currentTheme;

        applyBackgroundImage(localStorage.getItem('luckyDrawBgImage') || null);
        if(backgroundImageUpload) backgroundImageUpload.value = "";

        const savedTextColor = localStorage.getItem('luckyDrawWinnerTextColor') || '#333333';
        const savedFontSize = localStorage.getItem('luckyDrawWinnerFontSize') || '80px'; // Load font size, default to 80px

        applyWinnerStyles('#FFD700', savedTextColor, savedFontSize);

        if(winnerTextColorPicker) winnerTextColorPicker.value = currentWinnerTextColor;
        if(winnerFontSizeInput) {
            const sizeValue = parseInt(currentWinnerFontSize, 10);
            if (!isNaN(sizeValue)) {
                winnerFontSizeInput.value = sizeValue;
            } else {
                 winnerFontSizeInput.value = 80;
                 currentWinnerFontSize = '80px';
                 localStorage.setItem('luckyDrawWinnerFontSize', currentWinnerFontSize);
                 applyWinnerStyles(currentWinnerBorderColor, currentWinnerTextColor, currentWinnerFontSize);
            }
        }

        const savedDuration = localStorage.getItem('luckyDrawDuration');
        currentDrawDuration = savedDuration ? parseInt(savedDuration, 10) : 5000;
        if(isNaN(currentDrawDuration) || currentDrawDuration < 1000 || currentDrawDuration > 30000) currentDrawDuration = 5000;
        if(drawDurationInput) drawDurationInput.value = currentDrawDuration / 1000;

        // Load Advanced Settings
        advancedSettingsEnabled = localStorage.getItem('luckyDrawAdvancedEnabled') === 'true';
        if (advancedSettingsToggle) advancedSettingsToggle.checked = advancedSettingsEnabled;

        const savedAlwaysWinNames = localStorage.getItem('luckyDrawAlwaysWinNames');
        if (savedAlwaysWinNames) { try { alwaysWinNames = JSON.parse(savedAlwaysWinNames); } catch(e){ alwaysWinNames = []; console.error("Error parsing always win names from LS", e);}}
        else { alwaysWinNames = []; }
        if (alwaysWinNamesInput) alwaysWinNamesInput.value = alwaysWinNames.join('\n');

        // Apply display style for advanced settings based on loaded state
        if (advancedSettingsContent) {
            if (advancedSettingsEnabled) {
                advancedSettingsContent.style.display = 'block';
            } else {
                advancedSettingsContent.style.display = 'none';
            }
        }


        updateDrawButtonState();
        if (winnerDisplay) {
             // If advanced settings are enabled and there are always win names, clear the display initially
            if (advancedSettingsEnabled && alwaysWinNames.length > 0) {
                 winnerDisplay.textContent = '';
            }
            // Otherwise, handle the standard empty state messages
            else if (names.length === 0) {
                winnerDisplay.textContent = "Add names in settings!";
            } else {
                 winnerDisplay.textContent = '';
            }
        }
    }

    function updateDrawButtonState() {
        if (!drawButton) { console.error("Draw button not found!"); return; }
        // Disable draw button if currently drawing OR (main list is empty AND (advanced settings are off OR always win list is empty))
        drawButton.disabled = isDrawing || ((!advancedSettingsEnabled || alwaysWinNames.length === 0) && names.length === 0);
    }

    function startDraw() {
        if (!userInteracted || (audioCtx && audioCtx.state === 'suspended')) { initAudioContext(); }

        // Check if there are any names available to draw from (either main or always win)
        const hasNamesToDraw = names.length > 0 || (advancedSettingsEnabled && alwaysWinNames.length > 0);

        if (isDrawing || !hasNamesToDraw) {
             if (!hasNamesToDraw && winnerDisplay) {
                  // Display appropriate message if no names are available at all
                  if (names.length === 0 && (!advancedSettingsEnabled || alwaysWinNames.length === 0)) {
                       winnerDisplay.textContent = "Add names in settings!";
                  } else if (names.length > 0 && advancedSettingsEnabled && alwaysWinNames.length === 0) {
                       // If main list has names, but always win is empty and advanced is on
                       winnerDisplay.textContent = "Always Win list is empty!"; // Or similar
                  }
             }
             updateDrawButtonState(); // Ensure button is disabled if no names
             return;
        }


        if (!winnerDisplay || !mainContentArea || !confettiContainer) { console.error("startDraw: Critical UI element missing!"); return;}

        isDrawing = true;
        updateDrawButtonState();
        if(mainContentArea) mainContentArea.classList.remove('celebrate');
        clearConfetti();
        if(winnerDisplay) winnerDisplay.classList.remove('shake');

        // The interval should always spin through the main list of names for visual effect
        // If main list is empty but always win is active, spin always win names for visual effect
        const namesToSpin = names.length > 0 ? names : (advancedSettingsEnabled && alwaysWinNames.length > 0 ? alwaysWinNames : []);

         if (namesToSpin.length === 0) {
             console.warn("No names available to spin visually.");
             // If no names at all (neither main nor always win), just show message and stop
             isDrawing = false;
             updateDrawButtonState();
             if(winnerDisplay) winnerDisplay.textContent = "Add names in settings!";
             return;
         }


        drawInterval = setInterval(() => {
            const randomIndex = Math.floor(Math.random() * namesToSpin.length);
            if(winnerDisplay) winnerDisplay.textContent = namesToSpin[randomIndex];
            playTickSound();
        }, 100);

        drawTimeout = setTimeout(() => {
            clearInterval(drawInterval);
            selectFinalWinner();
        }, currentDrawDuration);
    }

    function selectFinalWinner() {
        if (!winnerDisplay || !mainContentArea || !confettiContainer || !drawButton || !removeWinnerToggle || !alwaysWinNamesInput) {
            console.error("selectFinalWinner: Critical UI element missing!");
            isDrawing = false;
            if(drawButton) updateDrawButtonState();
            return;
        }

        let winner = null;
        let winnerSource = 'main'; // 'main' or 'alwaysWin'

        // Check if advanced settings are enabled and always win list has names
        if (advancedSettingsEnabled && alwaysWinNames.length > 0) {
            console.log("Advanced settings enabled, selecting final winner from Always Win list.");
            const randomAlwaysWinIndex = Math.floor(Math.random() * alwaysWinNames.length);
            winner = alwaysWinNames[randomAlwaysWinIndex];
            winnerSource = 'alwaysWin';
        } else if (names.length > 0) {
            console.log("Selecting final winner from main names list.");
            // Select winner from the main list if advanced settings are off or always win list is empty
            const winnerIndex = Math.floor(Math.random() * names.length);
            winner = names[winnerIndex];
            winnerSource = 'main';
        } else {
             // This case should be handled by startDraw, but as a fallback
             if(winnerDisplay) winnerDisplay.textContent = "No names left!";
             isDrawing = false;
             updateDrawButtonState();
             return;
        }


        if(winnerDisplay) winnerDisplay.textContent = winner;

        playWinSound();
        showCelebration();
        if(winnerDisplay) winnerDisplay.classList.add('shake');


        // Handle removal based on winner source and toggle state
        if (removeWinnerToggle.checked) {
             if (winnerSource === 'main') {
                  console.log(`"Remove winner from list" is checked. Removing '${winner}' from main list.`);
                  const indexToRemove = names.indexOf(winner);
                  if (indexToRemove > -1) {
                      names.splice(indexToRemove, 1);
                      try {
                          localStorage.setItem('luckyDrawNames', JSON.stringify(names));
                          console.log("Updated main names list saved to localStorage. New count:", names.length);
                      } catch (e) {
                          console.error("Error saving updated main names to localStorage after removal:", e);
                      }
                       // Update main names textarea if settings are open
                       if (settingsSection && settingsSection.classList.contains('active') && nameListInput) {
                           nameListInput.value = names.join('\n');
                       }
                  } else {
                      console.warn(`Winner '${winner}' not found in the current main names list for removal.`);
                  }
             } else if (winnerSource === 'alwaysWin') {
                  console.log(`"Remove winner from list" is checked. Removing '${winner}' from both main and Always Win lists.`);

                  // Remove from main list
                  const mainIndexToRemove = names.indexOf(winner);
                  if (mainIndexToRemove > -1) {
                      names.splice(mainIndexToRemove, 1);
                      try {
                          localStorage.setItem('luckyDrawNames', JSON.stringify(names));
                          console.log("Updated main names list saved to localStorage after removal from Always Win.");
                      } catch (e) {
                          console.error("Error saving updated main names to localStorage after removal from Always Win:", e);
                      }
                       // Update main names textarea if settings are open
                       if (settingsSection && settingsSection.classList.contains('active') && nameListInput) {
                           nameListInput.value = names.join('\n');
                       }
                  } else {
                      console.warn(`Winner '${winner}' from Always Win list not found in the current main names list for removal.`);
                  }

                  // Remove from Always Win list
                  const alwaysWinIndexToRemove = alwaysWinNames.indexOf(winner);
                  if (alwaysWinIndexToRemove > -1) {
                       alwaysWinNames.splice(alwaysWinIndexToRemove, 1);
                       try {
                           localStorage.setItem('luckyDrawAlwaysWinNames', JSON.stringify(alwaysWinNames));
                           console.log("Updated Always Win names list saved to localStorage.");
                       } catch (e) {
                           console.error("Error saving updated Always Win names to localStorage:", e);
                       }
                       // Update always win names textarea if settings are open
                       if (settingsSection && settingsSection.classList.contains('active') && alwaysWinNamesInput) {
                            alwaysWinNamesInput.value = alwaysWinNames.join('\n');
                       }
                  } else {
                       console.warn(`Winner '${winner}' not found in the current Always Win names list for removal.`);
                  }
             }
        } else {
            console.log(`"Remove winner from list" is NOT checked. Winner '${winner}' remains in list(s).`);
        }


        isDrawing = false;
        updateDrawButtonState();

        // Update display message based on remaining names and settings
        const hasNamesLeft = names.length > 0 || (advancedSettingsEnabled && alwaysWinNames.length > 0);
        if (!hasNamesLeft) {
             setTimeout(() => {
                  if (winnerDisplay) winnerDisplay.textContent = "All names drawn!";
             }, 1000);
        } else if (names.length === 0 && removeWinnerToggle.checked && advancedSettingsEnabled && alwaysWinNames.length > 0) {
             console.log("Main list is empty, but Always Win list is active.");
             // Leave the last drawn winner from the always win list displayed.
        } else if (names.length > 0 && winnerDisplay.textContent === "All names drawn!") {
             // If names were added back after being empty, clear the "All names drawn!" message
             winnerDisplay.textContent = '';
        }
    }

    function showCelebration() {
        if (mainContentArea) mainContentArea.classList.add('celebrate');
        createConfetti(); // Confetti animation will now loop
    }

    function createConfetti() {
        if (!confettiContainer) { console.error("Confetti container not found!"); return; }
        // Clear existing confetti before creating new ones
        clearConfetti();
        console.log("Creating looping confetti...");
        const colors = ['#FFD700', '#FFC300', '#FFA500', '#FF8C00', '#FF69B4', '#00FFFF', '#7FFF00', '#BA55D3'];
        for (let i = 0; i < 150; i++) {
            const confettiPiece = document.createElement('div');
            confettiPiece.classList.add('confetti');
            confettiPiece.style.left = Math.random() * 100 + '%';
            confettiPiece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confettiPiece.style.width = (Math.random() * 6 + 6) + 'px';
            confettiPiece.style.height = confettiPiece.style.width;
            const fallDuration = 3000 + Math.random() * 2500;
            const drift = (Math.random() - 0.5) * 300;
            const rotation = Math.random() * 1080 - 540;

            // Set iterations to Infinity for continuous loop
            confettiPiece.animate([
                { transform: `translateY(-30vh) translateX(0px) rotate(0deg)`, opacity: 1 },
                { opacity: 1, offset: 0.1 },
                { transform: `translateY(130vh) translateX(${drift}px) rotate(${rotation}deg)`, opacity: 1 }
            ], {
                duration: fallDuration,
                easing: 'linear', // Changed to linear for smoother continuous fall
                delay: Math.random() * 700,
                fill: 'forwards',
                iterations: Infinity // Loop indefinitely
            });
            confettiContainer.appendChild(confettiPiece);
        }
    }

    function clearConfetti() {
        if (confettiContainer) confettiContainer.innerHTML = '';
        console.log("Confetti cleared.");
    }

    // --- Event Listeners ---
    if (settingsToggleButton) {
        settingsToggleButton.addEventListener('click', toggleSettingsSection);
    } else { console.error("FATAL: Settings toggle button not found!"); }

    if (saveSettingsButton) {
        saveSettingsButton.addEventListener('click', saveSettings);
    } else { console.error("FATAL: Save Settings button not found!"); }

    if (drawButton) {
        // When draw button is clicked, clear effects
        drawButton.addEventListener('click', () => {
            if (mainContentArea) mainContentArea.classList.remove('celebrate');
            clearConfetti();
            // Remove shake class from winner display
            if(winnerDisplay) winnerDisplay.classList.remove('shake');
            startDraw(); // Then start the draw
        });
    } else { console.error("FATAL: Draw button not found!"); }

    if (backgroundImageUpload) {
        backgroundImageUpload.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file && file.size > 2 * 1024 * 1024) {
                alert("Image size is too large (max 2MB). Please choose a smaller file.");
                backgroundImageUpload.value = "";
            }
        });
    } else { console.warn("backgroundImageUpload element not found.");}

    if (clearBackgroundButton) {
        clearBackgroundButton.addEventListener('click', () => {
            if (backgroundImageUpload) backgroundImageUpload.value = "";
            console.log("Custom background marked for clearing on next save.");
        });
    } else { console.warn("clearBackgroundButton element not found.");}

    if (clearWinnerButton) {
        // When clear winner button is clicked, clear effects
        clearWinnerButton.addEventListener('click', () => {
            if (winnerDisplay) {
                winnerDisplay.textContent = '';
                // Remove shake class from winner display
                winnerDisplay.classList.remove('shake');
            }
            if (mainContentArea) {
                mainContentArea.classList.remove('celebrate');
            }
            clearConfetti();
            console.log("Winner display and effects cleared by button.");
            updateDrawButtonState(); // Update button state as list might not be empty now
        });
    } else {
        console.warn("Clear Winner button (clear-winner-button) not found.");
    }

    // Event listener for the new advanced settings toggle
    if (advancedSettingsToggle) {
        advancedSettingsToggle.addEventListener('change', () => {
            if (advancedSettingsContent) {
                if (advancedSettingsToggle.checked) {
                    advancedSettingsContent.style.display = 'block';
                } else {
                    advancedSettingsContent.style.display = 'none';
                }
            }
            updateDrawButtonState(); // Update button state based on advanced settings
        });
    } else { console.error("Advanced settings toggle not found!"); }


    // Initial load of settings when the page loads
    loadSettings();
});
