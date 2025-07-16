document.addEventListener('DOMContentLoaded', () => {
    // --- DOM REFERENCES ---
    const form = document.getElementById('prompt-form');
    const outputJson = document.getElementById('output-json');

    // Dynamic containers
    const charactersContainer = document.getElementById('characters-container');
    const sceneAudioContainer = document.getElementById('scene-audio-container');
    const sceneVisualContainer = document.getElementById('scene-visual-container');

    // Main action buttons
    const addCharacterBtn = document.getElementById('add-character-btn');
    const generateBtn = document.getElementById('generate-btn');

    // Output & storage buttons
    const copyBtn = document.getElementById('copy-btn');
    const saveBtn = document.getElementById('save-btn');
    const loadBtn = document.getElementById('load-btn');
    const clearBtn = document.getElementById('clear-btn');

    // Templates
    const characterTemplate = document.getElementById('character-template');
    const dialogueTemplate = document.getElementById('dialogue-template');
    const actionTemplate = document.getElementById('action-template');
    const listItemTemplate = document.getElementById('list-item-template');

    // --- UTILITY FUNCTIONS ---

    /**
     * Shows a floating notification (toast).
     * @param {string} message - The message to display.
     * @param {string} type - The type of toast (success, error, info).
     */
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

    /**
     * Clones and prepares an element from a template.
     * @param {HTMLTemplateElement} template - The template to use.
     * @returns {HTMLElement} The cloned element.
     */
    function cloneFromTemplate(template) {
        return template.content.firstElementChild.cloneNode(true);
    }

    /**
     * Scrolls the view smoothly to an element.
     * @param {HTMLElement} element - The element to scroll to.
     */
    function scrollToElement(element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // --- UI LOGIC ---

    /**
     * Adds a new character to the form.
     */
    function addCharacter() {
        const characterEl = cloneFromTemplate(characterTemplate);
        characterEl.dataset.characterId = `char-${Date.now()}`;
        charactersContainer.appendChild(characterEl);
        scrollToElement(characterEl);
    }

    /**
     * Adds a new dialogue line to a specific character.
     * @param {HTMLElement} characterEl - The character element to add dialogue to.
     */
    function addDialogue(characterEl) {
        const dialogueEl = cloneFromTemplate(dialogueTemplate);
        characterEl.querySelector('.dialogue-container').appendChild(dialogueEl);
        scrollToElement(dialogueEl);
    }

    /**
     * Adds a new action to a specific character.
     * @param {HTMLElement} characterEl - The character element to add action to.
     */
    function addAction(characterEl) {
        const actionEl = cloneFromTemplate(actionTemplate);
        characterEl.querySelector('.actions-container').appendChild(actionEl);
        scrollToElement(actionEl);
    }

    /**
     * Adds an item to a list (e.g., scene audio/visual).
     * @param {string} targetType - 'scene-audio' or 'scene-visual'.
     */
    function addListItem(targetType) {
        const container = document.getElementById(`${targetType}-container`);
        const input = document.getElementById(`${targetType}-input`);
        const value = input.value.trim();

        if (value === '') {
            showToast('Field cannot be empty.', 'error');
            return;
        }

        const itemEl = cloneFromTemplate(listItemTemplate);
        itemEl.querySelector('span').textContent = value;
        container.appendChild(itemEl);
        input.value = '';
    }

    /**
     * Removes a dynamic item and its associates.
     * @param {HTMLElement} elementToRemove - The element to remove.
     */
    function removeDynamicItem(elementToRemove) {
        elementToRemove.remove();
    }

    // --- DATA & FORM LOGIC ---

    /**
     * Generates the prompt object from the current form state.
     * @returns {object|null} The prompt object or null if validation fails.
     */
    function generatePromptObject() {
        if (!form.checkValidity()) {
            form.reportValidity();
            showToast('Please fill out all required fields.', 'error');
            return null;
        }

        const prompt = {
            camera: {
                camera_movement: document.getElementById('camera_movement').value,
                lens_effects: document.getElementById('lens_effects').value,
                style: document.getElementById('style').value,
                temporal_elements: document.getElementById('temporal_elements').value,
            },
            characters: [],
            scene: {
                environment: document.getElementById('scene-environment').value,
                location: document.getElementById('scene-location').value,
                time_of_day: document.getElementById('scene-time_of_day').value,
                audio: Array.from(sceneAudioContainer.querySelectorAll('.list-item span')).map(s => s.textContent),
                visual: Array.from(sceneVisualContainer.querySelectorAll('.list-item span')).map(s => s.textContent)
            },
        };

        charactersContainer.querySelectorAll('[data-character-id]').forEach(charEl => {
            const name = charEl.querySelector('[name="char_name"]').value;
            if (!name) return;

            const characterData = {
                name: name,
                description: charEl.querySelector('[name="char_desc"]').value,
                wardrobe: charEl.querySelector('[name="char_wardrobe"]').value,
                dialogue: [],
                actions: []
            };

            charEl.querySelectorAll('.dialogue-container .dynamic-item').forEach(dialogueEl => {
                const line = dialogueEl.querySelector('[name="dialogue_line"]').value;
                if (line) {
                    characterData.dialogue.push({ line });
                }
            });

            charEl.querySelectorAll('.actions-container .dynamic-item').forEach(actionEl => {
                const entry = actionEl.querySelector('[name="action_entry"]').value;
                const movement = actionEl.querySelector('[name="action_movement"]').value;
                const reaction = actionEl.querySelector('[name="action_reaction"]').value;
                const line = actionEl.querySelector('[name="action_line"]').value;

                characterData.actions.push({
                    entry,
                    movement,
                    reaction,
                    line
                });
            });

            prompt.characters.push(characterData);
        });

        return prompt;
    }
    function loadStateFromLocalStorage() {
        const savedState = localStorage.getItem('promptGeneratorState');
        if (savedState) {
            try {
                const data = JSON.parse(savedState);
                applyLoadedDataToForm(data);
                showToast('Prompt loaded from local storage!', 'success');
            } catch (error) {
                console.error("Error loading state from local storage:", error);
                showToast('Could not load state from local storage. Data might be corrupt.', 'error');
            }
        } else {
            showToast('No saved prompt found in local storage.', 'info');
        }
    }

    /**
     * Saves the form data to a .json file.
     */
    async function saveToFile() {
        if (!window.showSaveFilePicker) {
            showToast('Your browser does not support saving files directly. Please use "Save to Local Storage" instead.', 'error');
            saveStateToLocalStorage(); // Fallback to local storage
            return;
        }

        const promptData = generatePromptObject();
        if (!promptData) return;

        try {
            const jsonString = JSON.stringify(promptData, null, 2);
            const fileHandle = await window.showSaveFilePicker({
                types: [{
                    description: 'JSON Files',
                    accept: {
                        'application/json': ['.json'],
                    },
                }],
                suggestedName: 'veo3_prompt.json',
            });
            const writable = await fileHandle.createWritable();
            await writable.write(jsonString);
            await writable.close();
            showToast('Prompt saved to file!', 'success');
        } catch (error) {
            console.error('Error saving file:', error);
            showToast('Failed to save file.', 'error');
        }
    }

    /**
     * Loads form data from a .json file.
     */
    async function loadFromFile() {
        if (!window.showOpenFilePicker) {
            showToast('Your browser does not support loading files directly. Please use "Load from Local Storage" instead.', 'error');
            loadStateFromLocalStorage(); // Fallback to local storage
            return;
        }

        try {
            const [fileHandle] = await window.showOpenFilePicker({
                types: [{
                    description: 'JSON Files',
                    accept: {
                        'application/json': ['.json'],
                    },
                }],
                multiple: false,
            });
            const file = await fileHandle.getFile();
            const contents = await file.text();
            const data = JSON.parse(contents);
            applyLoadedDataToForm(data);
            showToast('Prompt loaded from file!', 'success');
        } catch (error) {
            console.error('Error loading file:', error);
            showToast('Failed to load file.', 'error');
        }
    }

    function addListItemWithValue(targetType, value) {
        const input = document.getElementById(`${targetType}-input`);
        input.value = value;
        addListItem(targetType);
    }

    /**
     * Clears the entire form.
     * @param {boolean} [showSuccessToast=true] - Whether to show the success notification.
     */
    function clearForm(showSuccessToast = true) {
        form.reset();
        charactersContainer.innerHTML = '';
        sceneAudioContainer.innerHTML = '';
        sceneVisualContainer.innerHTML = '';
        outputJson.textContent = '';
        if (showSuccessToast) {
            showToast('Form cleared.', 'success');
        }
    }

    /**
     * Applies loaded data to the form fields.
     * @param {object} data - The parsed JSON data to apply.
     */
    function applyLoadedDataToForm(data) {
        clearForm(false); // Clear form without showing toast

        
        document.getElementById('camera-type').value = data.camera?.type || '';
        document.getElementById('camera-movement').value = data.camera?.movement || '';
        document.getElementById('camera-framing').value = data.camera?.framing || '';
        document.getElementById('camera-shot_type').value = data.camera?.shot_type || '';
        document.getElementById('scene-environment').value = data.scene?.environment || '';
        document.getElementById('scene-location').value = data.scene?.location || '';
        document.getElementById('scene-time_of_day').value = data.scene?.time_of_day || '';

        data.scene?.audio.forEach(item => addListItemWithValue('scene-audio', item));
        data.scene?.visual.forEach(item => addListItemWithValue('scene-visual', item));

        data.characters?.forEach((char, index) => {
            const characterEl = cloneFromTemplate(characterTemplate);
            characterEl.dataset.characterId = `char-${Date.now()}-${index}`;
            characterEl.querySelector('h4').textContent = `Character ${index + 1}`;
            characterEl.querySelector('[name="char_name"]').value = char.name || '';
            characterEl.querySelector('[name="char_desc"]').value = char.description || '';
            characterEl.querySelector('[name="char_wardrobe"]').value = char.wardrobe || '';
            charactersContainer.appendChild(characterEl);

            char.dialogue?.forEach(d => {
                addDialogue(characterEl);
                characterEl.querySelector('.dialogue-container').lastElementChild.querySelector('[name="dialogue_line"]').value = d.line;
            });

            char.actions?.forEach(a => {
                addAction(characterEl);
                const newActionEl = characterEl.querySelector('.actions-container').lastElementChild;
                newActionEl.querySelector('[name="action_entry"]').value = a.entry || '';
                newActionEl.querySelector('[name="action_movement"]').value = a.movement || '';
                newActionEl.querySelector('[name="action_reaction"]').value = a.reaction || '';
                newActionEl.querySelector('[name="action_line"]').value = a.line || '';
            });
        });

        generateBtn.click(); // Regenerate JSON output after loading
    }

    // --- EVENT LISTENERS ---

    addCharacterBtn.addEventListener('click', addCharacter);

    document.body.addEventListener('click', (e) => {
        if (e.target.matches('.remove-btn')) {
            const itemToRemove = e.target.closest('.dynamic-item, .list-item');
            if (itemToRemove) removeDynamicItem(itemToRemove);
        } else if (e.target.matches('.add-dialogue-btn')) {
            const characterEl = e.target.closest('[data-character-id]');
            if (characterEl) addDialogue(characterEl);
        } else if (e.target.matches('.add-action-btn')) {
            const characterEl = e.target.closest('[data-character-id]');
            if (characterEl) addAction(characterEl);
        } else if (e.target.matches('.add-item-btn')) {
            addListItem(e.target.dataset.target);
        }
    });

    document.body.addEventListener('blur', (e) => {
        if (e.target.matches('.editable-text')) {
            showToast('Changes saved.', 'success');
        }
    }, true); // Use capture phase for blur event

    document.body.addEventListener('keydown', (e) => {
        if (e.target.matches('.editable-text') && e.key === 'Enter') {
            e.preventDefault(); // Prevent new line
            e.target.blur(); // Trigger blur to save changes
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

    saveBtn.addEventListener('click', saveToFile); // Changed to saveToFile
    loadBtn.addEventListener('click', loadFromFile); // Changed to loadFromFile
    clearBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear the entire form? Unsaved changes will be lost.')) {
            clearForm();
        }
    });

    // --- INITIALIZATION ---
    // The form starts empty. The user can click "Load from File" to load saved data.
    clearForm(false);

    // --- Collapsible Fieldset Logic ---
    document.querySelectorAll('.collapsible-fieldset').forEach(fieldset => {
        const header = fieldset.querySelector('.collapsible-header');
        if (header) {
            header.addEventListener('click', () => {
                fieldset.classList.toggle('collapsed');
            });
        }
    });
});