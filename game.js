// ==================================================
// 1. IMPORTAR O THREE.JS e DRACOLoader
// ==================================================

import * as THREE from 'three';

import { GLTFLoader } from
    'three/addons/loaders/GLTFLoader.js';

import { DRACOLoader } from
    'three/addons/loaders/DRACOLoader.js';

// ==================================================
// CAIXA DE COLISÃO DO PERSONAGEM
// ==================================================

const caixaPersonagem = new THREE.Box3();

// Dimensões aproximadas do personagem
const larguraPersonagem = 0.6;
const alturaPersonagem = 1.8;
const profundidadePersonagem = 0.6;
    
// ==================================================
// 2. ELEMENTOS DA PÁGINA
// ==================================================

const areaJogo = document.getElementById('jogo');

const mensagem = document.getElementById('mensagem');

const status = document.getElementById('status');

// ==================================================
// SISTEMA DE COLISÃO
// ==================================================

// Lista de objetos que terão colisão
const objetosColisao = [];

// ==================================================
// 3. CRIAR A CENA 3D
// ==================================================

const cena = new THREE.Scene();

// Cor do céu

cena.background = new THREE.Color(0x87ceeb);

// Neblina para dar profundidade ao cenário

cena.fog = new THREE.Fog(
    0x87ceeb,
    35,
    100
);


// ==================================================
// 4. CRIAR A CÂMERA
// ==================================================

const camera = new THREE.PerspectiveCamera(

    60,

    areaJogo.clientWidth / areaJogo.clientHeight,

    0.1,

    200

);

// Posição inicial da câmera

camera.position.set(0, 7, 10);


// ==================================================
// 5. CRIAR O RENDERIZADOR
// ==================================================

const renderer = new THREE.WebGLRenderer({

    antialias: true

});

renderer.setSize(

    areaJogo.clientWidth,

    areaJogo.clientHeight

);

renderer.setPixelRatio(

    Math.min(window.devicePixelRatio, 2)

);

// Configurar sombras

renderer.shadowMap.enabled = true;

renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Ajustar a saída de cores

renderer.outputColorSpace = THREE.SRGBColorSpace;

// Adicionar o canvas à página

areaJogo.appendChild(renderer.domElement);


// ==================================================
// 6. ILUMINAÇÃO DO AMBIENTE
// ==================================================

// Luz ambiente

const luzAmbiente = new THREE.HemisphereLight(

    0xffffff,

    0x567d46,

    2

);

cena.add(luzAmbiente);


// Luz do sol

const sol = new THREE.DirectionalLight(

    0xffffff,

    3

);

sol.position.set(15, 25, 10);

sol.castShadow = true;

sol.shadow.mapSize.set(1024, 1024);

sol.shadow.camera.left = -25;

sol.shadow.camera.right = 25;

sol.shadow.camera.top = 25;

sol.shadow.camera.bottom = -25;

cena.add(sol);


// ==================================================
// 7. CRIAR O CAMPO
// ==================================================

// Geometria do chão

const geometriaChao = new THREE.PlaneGeometry(

    100,

    100

);

// Material da grama

const materialChao = new THREE.MeshStandardMaterial({

    color: 0x4caf50,

    roughness: 1

});

// Criar o chão

const chao = new THREE.Mesh(

    geometriaChao,

    materialChao

);

// Deitar o plano para formar o chão

chao.rotation.x = -Math.PI / 2;

// Posicionar no nível do solo

chao.position.y = 0;

// Receber sombras

chao.receiveShadow = true;

// Adicionar à cena

cena.add(chao);

// ==================================================
// FÍSICA DO PERSONAGEM
// ==================================================

// Velocidade vertical do personagem
let velocidadeVertical = 0;

// Força da gravidade
const gravidade = 20;

// Força do pulo
const forcaPulo = 8;

// Altura do chão
const alturaChao = 0;

// Verificar se o personagem está no chão
let noChao = true;

// ==================================================
// 10. CRIAR O PERSONAGEM
// ==================================================

// Grupo que controla a posição e a direção do personagem

const personagem = new THREE.Group();


cena.add(personagem);


// Posição inicial

personagem.position.set(0, 0, 0);


// Variáveis do modelo

let modeloCarregado = false;

let mixer = null;


// Carregador de modelos comprimidos com Draco

const dracoLoader = new DRACOLoader();

dracoLoader.setDecoderPath(
    'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/libs/draco/'
);

// Carregador de modelos 3D

const carregador = new GLTFLoader();

carregador.setDRACOLoader(dracoLoader);



// Importar o arquivo GLB

carregador.load(

    './assets/the_perfect_steve_rigged.glb',
    

    function (gltf) {

        const modelo = gltf.scene;


        // Calcular o tamanho original do modelo

        const caixaInicial = new THREE.Box3()

            .setFromObject(modelo);


        const tamanhoInicial = new THREE.Vector3();

        caixaInicial.getSize(tamanhoInicial);


        // Ajustar a escala automaticamente

        const maiorDimensao = Math.max(

            tamanhoInicial.x,

            tamanhoInicial.y,

            tamanhoInicial.z

        );


        if (maiorDimensao > 0) {

            const escala = 1.8 / maiorDimensao;

            modelo.scale.setScalar(escala);

        }


        // Centralizar o modelo horizontalmente

        const centroInicial = new THREE.Box3()

            .setFromObject(modelo)

            .getCenter(new THREE.Vector3());


        modelo.position.x -= centroInicial.x;

        modelo.position.z -= centroInicial.z;


        // Ajustar os pés ao nível do chão

        const caixaFinal = new THREE.Box3()

            .setFromObject(modelo);


        modelo.position.y -= caixaFinal.min.y;


        // Configurar sombras

        modelo.traverse(function (objeto) {

            if (objeto.isMesh) {

                objeto.castShadow = true;

                objeto.receiveShadow = true;

            }

        });


        // Adicionar o modelo ao personagem

        personagem.add(modelo);


        // Preparar animações, caso o arquivo possua alguma

        if (gltf.animations.length > 0) {

            mixer = new THREE.AnimationMixer(modelo);

            const animacao = mixer.clipAction(

                gltf.animations[0]

            );

            animacao.play();

        }


        modeloCarregado = true;


        mensagem.style.display = 'none';

        status.textContent = 'Explore o campo!';


        console.log('Personagem carregado com sucesso!');

    },

    function (progresso) {

        if (progresso.total > 0) {

            const porcentagem = Math.round(

                progresso.loaded / progresso.total * 100

            );

            mensagem.textContent =

                `Carregando personagem: ${porcentagem}%`;

        }

    },

    undefined,

    function (erro) {

        console.error(

            'Erro ao carregar o personagem:',

            erro

        );

        mensagem.textContent =

            'Não foi possível carregar o personagem. ' +

            'Verifique o arquivo assets/the_perfect_steve_rigged.glb.';

        status.textContent = 'Erro ao carregar o modelo';

    }

);

// ==================================================
// FUNÇÃO PARA CARREGAR MODELOS GLB
// ==================================================

function carregarModelo(
    arquivo,
    grupo,
    x,
    y,
    z,
    escala,
    colidir = false
) {

    // Carregar o arquivo GLB
    carregador.load(

        arquivo,

        // Quando o modelo terminar de carregar
        function (gltf) {

            const modelo = gltf.scene;

            // Definir a posição
            modelo.position.set(x, y, z);

            // Definir a escala
            modelo.scale.setScalar(escala);

            // Configurar sombras
            modelo.traverse(function (objeto) {

                if (objeto.isMesh) {

                    objeto.castShadow = true;

                    objeto.receiveShadow = true;

                }

            });

            // Adicionar o modelo ao grupo escolhido
            grupo.add(modelo);

            // ==================================================
            // CRIAR COLISÃO DO MODELO
            // ==================================================

            if (colidir) {

                // Criar uma caixa invisível ao redor do modelo
                const caixa = new THREE.Box3();

                caixa.setFromObject(modelo);

                // Adicionar à lista de colisões
                objetosColisao.push(caixa);

            }

            console.log(
                'Modelo carregado:',
                arquivo
            );

        },

        // Acompanhar o progresso do carregamento
        function (progresso) {

            if (progresso.total > 0) {

                const porcentagem = Math.round(
                    progresso.loaded /
                    progresso.total * 100
                );

                console.log(
                    `Carregando ${arquivo}: ${porcentagem}%`
                );

            }

        },

        // Tratar erros
        function (erro) {

            console.error(
                'Erro ao carregar:',
                arquivo,
                erro
            );

        }

    );

}


// Grupo que organizará o cenário
const grupoCenario = new THREE.Group();

// Adicionar o grupo à cena
cena.add(grupoCenario);

// Carregar o cenário
carregarModelo(
    './assets/minecraft_tree.glb',
    grupoCenario,
    15, 0, 0,
    1,
    true
);

// Carregar o cenário
carregarModelo(
    './assets/minecraft_tree.glb',
    grupoCenario,
    1, 0, 5,
    10,
    true
);

// Carregar o cenário
carregarModelo(
    './assets/house_minecraft.glb',
    grupoCenario,
    20, 0, 0,
    10,
    true
);




// ==================================================
// 11. CONTROLES DO TECLADO
// ==================================================

// Registrar as teclas pressionadas

const teclas = {};


// Detectar quando uma tecla é pressionada

window.addEventListener('keydown', function (evento) {

    const tecla = evento.key.toLowerCase();


    if (

        tecla === 'w' ||

        tecla === 'a' ||

        tecla === 's' ||

        tecla === 'd' ||

        tecla.startsWith('arrow')

    ) {

        evento.preventDefault();

    } if (evento.code === 'Space') {

        evento.preventDefault();

        // Só permite pular quando estiver no chão
        if (noChao) {

            velocidadeVertical = forcaPulo;

            noChao = false;

        }

    }
  

    teclas[tecla] = true;

});


// Detectar quando uma tecla é solta

window.addEventListener('keyup', function (evento) {

    const tecla = evento.key.toLowerCase();

    teclas[tecla] = false;

});


// Evitar que as teclas continuem pressionadas
// se a janela perder o foco

window.addEventListener('blur', function () {

    for (const tecla in teclas) {

        teclas[tecla] = false;

    }

});




// ==================================================
// 12. CONFIGURAR A MOVIMENTAÇÃO
// ==================================================

const velocidade = 6;


// Limites do campo

const limiteCampo = 30;


// Vetor para a direção do movimento

const direcao = new THREE.Vector3();


// ==================================================
// 13. ACOMPANHAR O PERSONAGEM COM A CÂMERA
// ==================================================

const alvoCamera = new THREE.Vector3();


// ==================================================
// 14. RELÓGIO PARA CONTROLAR O TEMPO
// ==================================================

const relogio = new THREE.Clock();

// ==================================================
// VERIFICAR COLISÕES
// ==================================================

function verificarColisao(x, y, z) {

    // Definir os limites da caixa do personagem
    caixaPersonagem.min.set(

        x - larguraPersonagem / 2,

        y,

        z - profundidadePersonagem / 2

    );

    caixaPersonagem.max.set(

        x + larguraPersonagem / 2,

        y + alturaPersonagem,

        z + profundidadePersonagem / 2

    );

    // Verificar colisão com cada objeto
    for (const caixa of objetosColisao) {

        if (caixaPersonagem.intersectsBox(caixa)) {

            return true;

        }

    }

    return false;

}

// ==================================================
// 15. FUNÇÃO PRINCIPAL DO JOGO
// ==================================================

function animar() {


    requestAnimationFrame(animar);


    // Calcular o tempo transcorrido

    const delta = Math.min(

        relogio.getDelta(),

        0.05

    );


    // Atualizar animações do modelo

    if (mixer) {

        mixer.update(delta);

    }


    // ==================================================
    // MOVIMENTAR O PERSONAGEM
    // ==================================================

    if (modeloCarregado) {

        // Zerar a direção antes de calcular o movimento

        direcao.set(0, 0, 0);


        // ==================================================
        // GRAVIDADE E MOVIMENTO VERTICAL
        // ==================================================

        // Aplicar gravidade enquanto estiver no ar
        if (!noChao) {

            velocidadeVertical -= gravidade * delta;

        }

        // Atualizar a posição vertical
        personagem.position.y += velocidadeVertical * delta;

        // ==================================================
        // VERIFICAR CONTATO COM O CHÃO
        // ==================================================

        if (personagem.position.y <= alturaChao) {

            personagem.position.y = alturaChao;

            velocidadeVertical = 0;

            noChao = true;

        }


        // Movimentação horizontal

        if (

            teclas['w'] ||

            teclas['arrowup']

        ) {

            direcao.z -= 1;

        }


        if (

            teclas['s'] ||

            teclas['arrowdown']

        ) {

            direcao.z += 1;

        }

        
        // Movimentação lateral

        if (

            teclas['a'] ||

            teclas['arrowleft']

        ) {

            direcao.x -= 1;

        }


        if (

            teclas['d'] ||

            teclas['arrowright']

        ) {

            direcao.x += 1;

        }


        // Verificar se existe movimento

        // ==================================================
        // MOVIMENTO COM COLISÃO
        // ==================================================

        if (direcao.lengthSq() > 0) {

            direcao.normalize();

            // Calcular o deslocamento
            const movimentoX = direcao.x * velocidade * delta;

            const movimentoZ = direcao.z * velocidade * delta;

            // ==============================================
            // TESTAR MOVIMENTO NO EIXO X
            // ==============================================

            const novaPosicaoX =
                personagem.position.x + movimentoX;

            if (!verificarColisao(

                novaPosicaoX,

                personagem.position.y,

                personagem.position.z

            )) {

                personagem.position.x = novaPosicaoX;

            }

            // ==============================================
            // TESTAR MOVIMENTO NO EIXO Z
            // ==============================================

            const novaPosicaoZ =
                personagem.position.z + movimentoZ;

            if (!verificarColisao(

                personagem.position.x,

                personagem.position.y,

                novaPosicaoZ

            )) {

                personagem.position.z = novaPosicaoZ;

            }

            // Rotacionar o personagem conforme o movimento
            personagem.rotation.y = Math.atan2(

                direcao.x,

                direcao.z

            );

        }



        // Impedir que o personagem saia do campo

        personagem.position.x = THREE.MathUtils.clamp(

            personagem.position.x,

            -limiteCampo,

            limiteCampo

        );


        personagem.position.z = THREE.MathUtils.clamp(

            personagem.position.z,

            -limiteCampo,

            limiteCampo

        );

        // ==================================================
        // CÂMERA EM PRIMEIRA PESSOA
        // ==================================================

        // Altura da câmera em relação ao personagem
        const alturaCamera = 1.6;

        // Pequeno deslocamento para posicionar a câmera no rosto
        const deslocamentoFrontal = 0.1;

        // Calcular a posição da câmera
        const deslocamentoCamera = new THREE.Vector3(
            0,
            alturaCamera,
            deslocamentoFrontal
        );

        // Girar o deslocamento conforme a direção do personagem
        deslocamentoCamera.applyQuaternion(
            personagem.quaternion
        );

        // Definir a posição desejada da câmera
        const posicaoDesejada = new THREE.Vector3(
            personagem.position.x + deslocamentoCamera.x,
            personagem.position.y + deslocamentoCamera.y,
            personagem.position.z + deslocamentoCamera.z
        );

        // Movimento suave da câmera
        camera.position.lerp(
            posicaoDesejada,
            1 - Math.exp(-5 * delta)
        );

        // Definir para onde a câmera deve olhar
        const direcaoOlhar = new THREE.Vector3(0, 0, 1);

        // Girar a direção conforme a orientação do personagem
        direcaoOlhar.applyQuaternion(
            personagem.quaternion
        );

        // Definir o ponto observado pela câmera
        alvoCamera.copy(posicaoDesejada).add(
            direcaoOlhar.multiplyScalar(10)
        );

        // Orientar a câmera
        camera.lookAt(alvoCamera);


        // ==================================================
        // DESENHAR A CENA
        // ==================================================

        renderer.render(

            cena,

            camera

        );

    }

}


// Iniciar o jogo

animar();


// ==================================================
// 16. AJUSTAR A TELA QUANDO A JANELA MUDA DE TAMANHO
// ==================================================

window.addEventListener('resize', function () {

    const largura = areaJogo.clientWidth;

    const altura = areaJogo.clientHeight;


    // Atualizar proporção da câmera

    camera.aspect = largura / altura;

    camera.updateProjectionMatrix();


    // Redimensionar o renderizador

    renderer.setSize(

        largura,

        altura

    );

});
