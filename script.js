document.addEventListener('DOMContentLoaded', () => {
    // --- DOM REFERENCES ---
    const form = document.getElementById('prompt-form');
    const outputSentence = document.getElementById('output-sentence');
    const charactersContainer = document.getElementById('characters-container');
    const timelineContainer = document.getElementById('timeline-container');
    const addCharacterBtn = document.getElementById('add-character-btn');
    const addTimelineBtn = document.getElementById('add-timeline-btn');
    const generateBtn = document.getElementById('generate-btn');
    const copyBtn = document.getElementById('copy-btn');
    const clearBtn = document.getElementById('clear-btn');
    const characterTemplate = document.getElementById('character-template');
    const timelineEventTemplate = document.getElementById('timeline-event-template');

    // Drawing Area DOM References
    const drawingCanvas = document.getElementById('drawing-canvas');
    const ctx = drawingCanvas.getContext('2d');
    const colorPicker = document.getElementById('color-picker');
    const brushSizeInput = document.getElementById('brush-size');
    const clearCanvasBtn = document.getElementById('clear-canvas-btn');
    const imageLoader = document.getElementById('image-loader');
    const downloadImageBtn = document.getElementById('download-image-btn');
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');
    console.log('undoBtn:', undoBtn);
    console.log('redoBtn:', redoBtn);

    // Text Drawing DOM References
    const textInput = document.getElementById('text-input');
    const fontSizeInput = document.getElementById('font-size');
    const addTextBtn = document.getElementById('add-text-btn');

    // --- UTILITY FUNCTIONS ---
    function showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toast-container');
        const alertDiv = document.createElement('div');
        alertDiv.classList.add('alert', 'alert-dismissible', 'fade', 'show', 'position-absolute', 'bottom-0', 'end-0', 'm-3');
        alertDiv.setAttribute('role', 'alert');

        let alertClass = 'alert-info';
        if (type === 'success') {
            alertClass = 'alert-success';
        } else if (type === 'error') {
            alertClass = 'alert-danger';
        }
        alertDiv.classList.add(alertClass);

        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        toastContainer.appendChild(alertDiv);

        setTimeout(() => {
            const bsAlert = new bootstrap.Alert(alertDiv);
            bsAlert.close();
        }, 3000);
    }

    function cloneFromTemplate(template) {
        return template.content.firstElementChild.cloneNode(true);
    }

    function scrollToElement(element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // --- UI LOGIC ---
    function addCharacter() {
        const characterEl = cloneFromTemplate(characterTemplate);
        characterEl.dataset.characterId = `char-${Date.now()}`;
        charactersContainer.appendChild(characterEl);
        characterEl.classList.add('fade-in'); // Add fade-in class
        scrollToElement(characterEl);
    }

    function addTimelineEvent() {
        const timelineEl = cloneFromTemplate(timelineEventTemplate);
        timelineEl.dataset.timelineId = `timeline-${Date.now()}`;
        timelineContainer.appendChild(timelineEl);
        timelineEl.classList.add('fade-in'); // Add fade-in class
        scrollToElement(timelineEl);
    }

    function removeDynamicItem(elementToRemove) {
        elementToRemove.remove();
    }

    // --- DATA & FORM LOGIC ---
    function generatePromptObject() {
        if (!form.checkValidity()) {
            form.reportValidity();
            showToast('Please fill out all required fields.', 'error');
            return null;
        }

        const prompt = {
            scene: {
                environment: document.getElementById('scene-environment').value,
                location: document.getElementById('scene-location').value,
                time_of_day: document.getElementById('scene-time_of_day').value,
                audio: document.getElementById('scene-audio').value,
                visual: document.getElementById('scene-visual').value
            },
            camera: {
                camera_movement: document.getElementById('camera_movement').value,
                lens_effects: document.getElementById('lens_effects').value,
                style: document.getElementById('style').value,
                temporal_elements: document.getElementById('temporal_elements').value,
            },
            characters: [],
            timeline: [],
        };

        charactersContainer.querySelectorAll('[data-character-id]').forEach(charEl => {
            const characterData = {
                description: charEl.querySelector('[name="char_desc"]').value,
                wardrobe: charEl.querySelector('[name="char_wardrobe"]').value,
                dialogue: charEl.querySelector('[name="char_dialogue"]').value,
                action: charEl.querySelector('[name="char_action"]').value
            };
            prompt.characters.push(characterData);
        });

        prompt.timeline = [];
        timelineContainer.querySelectorAll('[data-timeline-id]').forEach((eventEl, index) => {
            const timestamp = eventEl.querySelector('[name="timeline_timestamp"]').value;
            const action = eventEl.querySelector('[name="timeline_action"]').value;

            prompt.timeline.push({
                sequence: index + 1,
                timestamp: timestamp,
                action: action,
                audio: eventEl.querySelector('[name="timeline_audio"]').value
            });
        });

        return prompt;
    }

    function generateSentence(promptData) {
        if (!promptData) return '';

        let sentence = '';

        // Scene
        if (promptData.scene) {
            const { environment, location, time_of_day, audio, visual } = promptData.scene;
            if (location) sentence += `In ${location}, `;
            if (time_of_day) sentence += `at ${time_of_day}, `;
            if (environment) sentence += `the scene is ${environment}. `;
            if (audio) sentence += `The audio is ${audio}. `;
            if (visual) sentence += `Visually, ${visual}. `;
        }

        // Camera
        if (promptData.camera) {
            const { camera_movement, lens_effects, style, temporal_elements } = promptData.camera;
            if (camera_movement && camera_movement !== 'None') sentence += `The camera ${camera_movement}. `;
            if (lens_effects && lens_effects !== 'None') sentence += `It has ${lens_effects}. `;
            if (style && style !== 'None') sentence += `The style is ${style}. `;
            if (temporal_elements && temporal_elements !== 'None') sentence += `There are ${temporal_elements}. `;
        }

        // Characters
        if (promptData.characters && promptData.characters.length > 0) {
            promptData.characters.forEach((char, index) => {
                sentence += `Character ${index + 1} is ${char.description}`;
                if (char.wardrobe) sentence += ` wearing ${char.wardrobe}`;
                if (char.action) sentence += `, ${char.action}`;
                if (char.dialogue) sentence += ` and says, "${char.dialogue}"`;
                sentence += '. ';
            });
        }

        // Timeline
        if (promptData.timeline && promptData.timeline.length > 0) {
            sentence += 'The timeline is as follows: ';
            promptData.timeline.forEach(event => {
                if (event.timestamp) sentence += `At ${event.timestamp}, `;
                sentence += `${event.action}`;
                if (event.audio) sentence += ` with audio of ${event.audio}`;
                sentence += '. ';
            });
        }

        return sentence.trim();
    }

    function clearForm(showSuccessToast = true) {
        form.reset();
        charactersContainer.innerHTML = '';
        timelineContainer.innerHTML = ''; // Clear timeline events
        outputSentence.textContent = '';
        if (showSuccessToast) {
            showToast('Form cleared.', 'success');
        }
    }

    // --- DRAWING LOGIC ---
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    let brushColor = colorPicker.value;
    let brushSize = brushSizeInput.value;

    // Text Drawing State
    let isAddingText = false;
    let currentText = '';
    let currentFontSize = fontSizeInput.value;

    // Undo/Redo History
    const canvasHistory = [];
    let historyPointer = -1;

    function saveCanvasState() {
        // Clear any redo states if a new action is performed
        if (historyPointer < canvasHistory.length - 1) {
            canvasHistory.splice(historyPointer + 1);
        }
        canvasHistory.push(drawingCanvas.toDataURL());
        historyPointer = canvasHistory.length - 1;
        updateUndoRedoButtons();
    }

    function restoreCanvasState() {
        if (historyPointer < 0) return;

        const img = new Image();
        img.onload = () => {
            ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
            ctx.drawImage(img, 0, 0);
        };
        img.src = canvasHistory[historyPointer];
    }

    function undo() {
        if (historyPointer > 0) {
            historyPointer--;
            restoreCanvasState();
        } else if (historyPointer === 0) {
            // If at the first state, clear canvas
            historyPointer--;
            ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
        }
        updateUndoRedoButtons();
    }

    function redo() {
        if (historyPointer < canvasHistory.length - 1) {
            historyPointer++;
            restoreCanvasState();
        }
        updateUndoRedoButtons();
    }

    function updateUndoRedoButtons() {
        undoBtn.disabled = historyPointer <= 0;
        redoBtn.disabled = historyPointer >= canvasHistory.length - 1;
    }

    function setupCanvas() {
        const canvas = drawingCanvas;
        // Sync canvas resolution with its display size
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        // Re-apply drawing styles, as they can be reset when canvas size changes
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.strokeStyle = brushColor; // Re-apply current color
        ctx.lineWidth = brushSize;   // Re-apply current brush size

        // Restore the last state after resizing
        restoreCanvasState(); // Always restore state to redraw content
    }

    function draw(e) {
        if (!isDrawing) return;
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
        [lastX, lastY] = [e.offsetX, e.offsetY];
    }

    function drawText(text, x, y, color, fontSize) {
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.fillStyle = color;
        ctx.fillText(text, x, y);
    }

    // --- EVENT LISTENERS ---
    addCharacterBtn.addEventListener('click', addCharacter);
    addTimelineBtn.addEventListener('click', addTimelineEvent);

    document.body.addEventListener('click', (e) => {
        if (e.target.matches('.remove-btn')) {
            const itemToRemove = e.target.closest('.dynamic-item');
            if (itemToRemove) removeDynamicItem(itemToRemove);
        }
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!form.checkValidity()) {
            e.stopPropagation();
            // Find all invalid fields
            const invalidFields = form.querySelectorAll(':invalid');
            invalidFields.forEach(field => {
                // Find the closest parent collapse element
                let currentParent = field.parentElement;
                while (currentParent && !currentParent.classList.contains('collapse')) {
                    currentParent = currentParent.parentElement;
                }
                if (currentParent) {
                    // Ensure the collapse element is shown
                    const bsCollapse = new bootstrap.Collapse(currentParent, { toggle: false });
                    bsCollapse.show();
                }
            });
            showToast('Please fill out all required fields.', 'error');
        }
        form.classList.add('was-validated');

        const promptData = generatePromptObject();
        if (promptData) {
            const sentence = generateSentence(promptData);
            outputSentence.textContent = sentence;
        }
    });

    copyBtn.addEventListener('click', () => {
        if (outputSentence.textContent) {
            navigator.clipboard.writeText(outputSentence.textContent)
                .then(() => showToast('Copied to clipboard!', 'success'))
                .catch(() => showToast('Failed to copy.', 'error'));
        } else {
            showToast('Nothing to copy.', 'error');
        }
    });

    clearBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear the entire form? Unsaved changes will be lost.')) {
            clearForm();
        }
    });

    // Drawing Area Event Listeners
    drawingCanvas.addEventListener('mousedown', (e) => {
        if (isAddingText) {
            // Immediately switch out of text mode
            isAddingText = false;
            drawingCanvas.style.cursor = 'default';

            if (currentText) {
                drawText(currentText, e.offsetX, e.offsetY, brushColor, currentFontSize);
                saveCanvasState(); // Save state after adding text
                showToast('Text added!', 'success');
                textInput.value = ''; // Clear text input after adding
                currentText = '';
            }
        } else {
            isDrawing = true;
            [lastX, lastY] = [e.offsetX, e.offsetY];
        }
    });
    drawingCanvas.addEventListener('mousemove', draw);
    drawingCanvas.addEventListener('mouseup', () => {
        if (isDrawing) {
            isDrawing = false;
            saveCanvasState(); // Save state after drawing
        }
    });
    drawingCanvas.addEventListener('mouseout', () => {
        if (isDrawing) {
            isDrawing = false;
            saveCanvasState(); // Save state if mouse leaves canvas while drawing
        }
    });

    colorPicker.addEventListener('change', (e) => {
        brushColor = e.target.value;
        ctx.strokeStyle = brushColor;
    });

    brushSizeInput.addEventListener('change', (e) => {
        brushSize = e.target.value;
        ctx.lineWidth = brushSize;
    });

    textInput.addEventListener('input', (e) => {
        currentText = e.target.value;
    });

    fontSizeInput.addEventListener('change', (e) => {
        currentFontSize = e.target.value;
    });

    addTextBtn.addEventListener('click', () => {
        if (textInput.value.trim() === '') {
            showToast('Please enter text to add.', 'error');
            return;
        }
        isAddingText = true;
        currentText = textInput.value.trim();
        showToast('Click on the canvas to position the text.', 'info');
        drawingCanvas.style.cursor = 'crosshair'; // Change cursor to indicate text mode
    });

    clearCanvasBtn.addEventListener('click', () => {
        ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
        saveCanvasState(); // Save state after clearing
    });

    downloadImageBtn.addEventListener('click', () => {
        const image = drawingCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = 'drawing.png';
        link.href = image;
        link.click();
    });

    if (undoBtn) {
        undoBtn.addEventListener('click', undo); // Undo button event listener
    } else {
        console.error('Element with ID "undo-btn" not found.');
    }
    if (redoBtn) {
        redoBtn.addEventListener('click', redo); // Redo button event listener
    } else {
        console.error('Element with ID "redo-btn" not found.');
    }

    imageLoader.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            console.log('File selected:', file.name, file.type);
            const reader = new FileReader();
            reader.onload = (event) => {
                console.log('FileReader loaded result.');
                const img = new Image();
                img.onload = () => {
                    console.log('Image loaded. Dimensions:', img.width, img.height);
                    // Clear canvas before drawing new image
                    ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
                    // Draw image, scaling it to fit the canvas while maintaining aspect ratio
                    const aspectRatio = img.width / img.height;
                    let newWidth = drawingCanvas.width;
                    let newHeight = drawingCanvas.height;

                    if (drawingCanvas.width / drawingCanvas.height > aspectRatio) {
                        newWidth = drawingCanvas.height * aspectRatio;
                    } else {
                        newHeight = drawingCanvas.width / aspectRatio;
                    }

                    const x = (drawingCanvas.width - newWidth) / 2;
                    const y = (drawingCanvas.height - newHeight) / 2;

                    console.log('Drawing image with:', { x, y, newWidth, newHeight });
                    ctx.drawImage(img, x, y, newWidth, newHeight);
                    saveCanvasState(); // Save state after loading image
                };
                img.onerror = () => {
                    console.error('Error loading image.');
                    showToast('Error loading image.', 'error');
                };
                img.src = event.target.result;
            };
            reader.onerror = () => {
                console.error('Error reading file.');
                showToast('Error reading file.', 'error');
            };
            reader.readAsDataURL(file);
        } else {
            console.log('No file selected.');
        }
    });

    // --- INITIALIZATION ---
    clearForm(false);
    setupCanvas();
    saveCanvasState(); // Save initial blank state

    // Adjust canvas size on window resize
    window.addEventListener('resize', setupCanvas);

    // Initialize collapse icons
    document.querySelectorAll('.card-header[data-bs-toggle="collapse"]').forEach(header => {
        const icon = header.querySelector('.collapse-icon');
        const targetId = header.getAttribute('data-bs-target');
        const targetElement = document.querySelector(targetId);
        if (icon && targetElement) {
            if (targetElement.classList.contains('show')) {
                icon.classList.add('bi-chevron-up'); // Up arrow
            } else {
                icon.classList.add('bi-chevron-down'); // Down arrow
            }
        }
    });

    // Event listener for drawing area collapse
    const drawingAreaCollapse = document.getElementById('drawingArea');
    if (drawingAreaCollapse) {
        drawingAreaCollapse.addEventListener('shown.bs.collapse', () => {
            setupCanvas();
        });
    }

    // Update collapse icons
    document.querySelectorAll('.card-header[data-bs-toggle="collapse"]').forEach(header => {
        header.addEventListener('click', function() {
            const icon = this.querySelector('.collapse-icon');
            if (icon) {
                const targetId = this.getAttribute('data-bs-target');
                const targetElement = document.querySelector(targetId);
                if (targetElement.classList.contains('show')) {
                    icon.classList.remove('bi-chevron-up');
                    icon.classList.add('bi-chevron-down');
                } else {
                    icon.classList.remove('bi-chevron-down');
                    icon.classList.add('bi-chevron-up');
                }
            }
        });
    });
});