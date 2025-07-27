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

    // --- UTILITY FUNCTIONS ---
    function showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        toastContainer.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => toast.remove());
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
        scrollToElement(characterEl);
    }

    function addTimelineEvent() {
        const timelineEl = cloneFromTemplate(timelineEventTemplate);
        timelineEl.dataset.timelineId = `timeline-${Date.now()}`;
        timelineContainer.appendChild(timelineEl);
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
            const description = charEl.querySelector('[name="char_desc"]').value;
            if (!description) return;
            const characterData = {
                description: description,
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
            if (!action) return; // Skip empty actions

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

    function setupCanvas() {
        // Set canvas dimensions to match its display size
        drawingCanvas.width = drawingCanvas.offsetWidth;
        drawingCanvas.height = drawingCanvas.offsetHeight;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize;
    }

    function draw(e) {
        if (!isDrawing) return;
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
        [lastX, lastY] = [e.offsetX, e.offsetY];
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
        isDrawing = true;
        [lastX, lastY] = [e.offsetX, e.offsetY];
    });
    drawingCanvas.addEventListener('mousemove', draw);
    drawingCanvas.addEventListener('mouseup', () => isDrawing = false);
    drawingCanvas.addEventListener('mouseout', () => isDrawing = false);

    colorPicker.addEventListener('change', (e) => {
        brushColor = e.target.value;
        ctx.strokeStyle = brushColor;
    });

    brushSizeInput.addEventListener('change', (e) => {
        brushSize = e.target.value;
        ctx.lineWidth = brushSize;
    });

    clearCanvasBtn.addEventListener('click', () => {
        ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    });

    downloadImageBtn.addEventListener('click', () => {
        const image = drawingCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = 'drawing.png';
        link.href = image;
        link.click();
    });

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

    // Adjust canvas size on window resize
    window.addEventListener('resize', setupCanvas);

    // Event listener for drawing area collapsible fieldset
    const drawingAreaFieldset = Array.from(document.querySelectorAll('.collapsible-fieldset')).find(fieldset => {
        const legend = fieldset.querySelector('.collapsible-header legend');
        return legend && legend.textContent.trim() === 'Drawing Area';
    });

    if (drawingAreaFieldset) {
        drawingAreaFieldset.querySelector('.collapsible-header').addEventListener('click', () => {
            // Ensure canvas is correctly sized when expanded
            if (!drawingAreaFieldset.classList.contains('collapsed')) {
                setupCanvas();
            }
        });
    }

    document.querySelectorAll('.collapsible-fieldset').forEach(fieldset => {
        const header = fieldset.querySelector('.collapsible-header');
        if (header) {
            header.addEventListener('click', () => {
                fieldset.classList.toggle('collapsed');
            });
        }
    });
});