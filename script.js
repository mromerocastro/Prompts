document.addEventListener('DOMContentLoaded', () => {
    // --- DOM REFERENCES ---
    const form = document.getElementById('prompt-form');
    const outputJson = document.getElementById('output-json');
    const charactersContainer = document.getElementById('characters-container');
    const timelineContainer = document.getElementById('timeline-container');
    const addCharacterBtn = document.getElementById('add-character-btn');
    const addTimelineBtn = document.getElementById('add-timeline-btn');
    const generateBtn = document.getElementById('generate-btn');
    const copyBtn = document.getElementById('copy-btn');
    const saveBtn = document.getElementById('save-btn');
    const loadBtn = document.getElementById('load-btn');
    const clearBtn = document.getElementById('clear-btn');
    const characterTemplate = document.getElementById('character-template');
    const timelineEventTemplate = document.getElementById('timeline-event-template');

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

    async function saveToFile() {
        if (!window.showSaveFilePicker) {
            showToast('Your browser does not support saving files directly.', 'error');
            return;
        }
        const promptData = generatePromptObject();
        if (!promptData) return;
        try {
            const jsonString = JSON.stringify(promptData, null, 2);
            const fileHandle = await window.showSaveFilePicker({
                types: [{
                    description: 'JSON Files',
                    accept: { 'application/json': ['.json'] },
                }],
                suggestedName: 'veo3_prompt.json',
            });
            const writable = await fileHandle.createWritable();
            await writable.write(jsonString);
            await writable.close();
            showToast('Prompt saved to file!', 'success');
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Error saving file:', error);
                showToast('Failed to save file.', 'error');
            }
        }
    }

    async function loadFromFile() {
        if (!window.showOpenFilePicker) {
            showToast('Your browser does not support loading files directly.', 'error');
            return;
        }
        try {
            const [fileHandle] = await window.showOpenFilePicker({
                types: [{
                    description: 'JSON Files',
                    accept: { 'application/json': ['.json'] },
                }],
                multiple: false,
            });
            const file = await fileHandle.getFile();
            const contents = await file.text();
            const data = JSON.parse(contents);
            applyLoadedDataToForm(data);
            showToast('Prompt loaded from file!', 'success');
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Error loading file:', error);
                showToast('Failed to load file.', 'error');
            }
        }
    }

    function clearForm(showSuccessToast = true) {
        form.reset();
        charactersContainer.innerHTML = '';
        timelineContainer.innerHTML = ''; // Clear timeline events
        outputJson.textContent = '';
        if (showSuccessToast) {
            showToast('Form cleared.', 'success');
        }
    }

    function applyLoadedDataToForm(data) {
        clearForm(false);

        if (data.camera) {
            document.getElementById('camera_movement').value = data.camera.camera_movement || '';
            document.getElementById('lens_effects').value = data.camera.lens_effects || '';
            document.getElementById('style').value = data.camera.style || '';
            document.getElementById('temporal_elements').value = data.camera.temporal_elements || '';
        }

        if (data.scene) {
            document.getElementById('scene-environment').value = data.scene.environment || '';
            document.getElementById('scene-location').value = data.scene.location || '';
            document.getElementById('scene-time_of_day').value = data.scene.time_of_day || '';
            document.getElementById('scene-audio').value = data.scene.audio || '';
            document.getElementById('scene-visual').value = data.scene.visual || '';
        }

        if (data.characters) {
            data.characters.forEach((char, index) => {
                addCharacter();
                const newCharacterEl = charactersContainer.lastElementChild;
                newCharacterEl.querySelector('h4').textContent = `Character ${index + 1}`;
                newCharacterEl.querySelector('[name="char_desc"]').value = char.description || '';
                newCharacterEl.querySelector('[name="char_wardrobe"]').value = char.wardrobe || '';
                newCharacterEl.querySelector('[name="char_dialogue"]').value = char.dialogue || '';
                newCharacterEl.querySelector('[name="char_action"]').value = char.action || '';
            });
        }

        if (data.timeline) {
            data.timeline.forEach(event => {
                addTimelineEvent();
                const newTimelineEl = timelineContainer.lastElementChild;
                newTimelineEl.querySelector('[name="timeline_timestamp"]').value = event.timestamp || '';
                newTimelineEl.querySelector('[name="timeline_action"]').value = event.action || '';
                newTimelineEl.querySelector('[name="timeline_audio"]').value = event.audio || '';
            });
        }

        generateBtn.click();
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
            outputJson.textContent = JSON.stringify(promptData, null, 2);
        }
    });

    copyBtn.addEventListener('click', () => {
        if (outputJson.textContent) {
            navigator.clipboard.writeText(outputJson.textContent)
                .then(() => showToast('Copied to clipboard!', 'success'))
                .catch(() => showToast('Failed to copy.', 'error'));
        } else {
            showToast('Nothing to copy.', 'error');
        }
    });

    saveBtn.addEventListener('click', saveToFile);
    loadBtn.addEventListener('click', loadFromFile);
    clearBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear the entire form? Unsaved changes will be lost.')) {
            clearForm();
        }
    });

    // --- INITIALIZATION ---
    clearForm(false);

    document.querySelectorAll('.collapsible-fieldset').forEach(fieldset => {
        const header = fieldset.querySelector('.collapsible-header');
        if (header) {
            header.addEventListener('click', () => {
                fieldset.classList.toggle('collapsed');
            });
        }
    });
});
