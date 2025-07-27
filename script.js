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