/* Estilos para o formulário de anúncio */
.form-anuncio {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.tipo-anuncio-container {
    display: flex;
    gap: 15px;
    margin-bottom: 20px;
}

.tipo-anuncio-option {
    flex: 1;
    text-align: center;
}

.tipo-anuncio-option input[type="radio"] {
    display: none;
}

.tipo-anuncio-option label {
    display: block;
    padding: 15px;
    border: 2px solid #ddd;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s;
}

.tipo-anuncio-option input[type="radio"]:checked + label {
    border-color: #3498db;
    background-color: #f0f8ff;
}

.tipo-anuncio-option i {
    font-size: 24px;
    margin-bottom: 10px;
    display: block;
    color: #3498db;
}

.image-upload-container {
    margin: 20px 0;
}

.image-preview {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 10px;
}

.image-pr
  
eview-item {
    width: 100px;
    height: 100px;
    border-radius: 4px;
    overflow: hidden;
    position: relative;
}

.image-preview-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.no-images {
    color: #777;
    font-style: italic;
    text-align: center;
    padding: 20px;
    border: 1px dashed #ddd;
    border-radius: 4px;
}

/* Estilos para campos do formulário */
.form-group {
    margin-bottom: 20px;
}


/* Type Selector Styles */
.type-selector {
    margin-bottom: 2rem;
}

.type-btn {
    width: 100%;
    padding: 1rem;
    font-weight: bold;
    transition: all 0.3s;
    display: flex;
    align-items: center;
    justify-content: center;
}

.type-btn.active {
    background-color: var(--primary-color);
    color: white;
    border-color: var(--primary-color);
}

.type-btn i {
    font-size: 1.2rem;
    margin-right: 0.5rem;
}

.form-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 600;
    color: #333;
}

.form-control {
    width: 100%;
    padding: 10px 15px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 16px;
}

.form-select {
    width: 100%;
    padding: 10px 15px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 16px;
    background-color: #fff;
}

.btn-submit {
    background-color: #3498db;
    color: white;
    border: none;
    padding: 12px 20px;
    border-radius: 4px;
    font-size: 16px;
    cursor: pointer;
    transition: background-color 0.3s;
    width: 100%;
}

.btn-submit:hover {
    background-color: #2980b9;
}

.btn-submit:disabled {
    background-color: #95a5a6;
    cursor: not-allowed;
}

/* Responsividade */
@media (max-width: 768px) {
    .tipo-anuncio-container {
        flex-direction: column;
    }
}
