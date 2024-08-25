const express = require('express');
const axios = require('axios');
const iconv = require('iconv-lite');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000; // Usando a porta 3000 para evitar problemas de permissão

// Configuração de CORS para permitir todas as origens
app.use(cors()); // Permite qualquer origem

app.use(express.json()); // Middleware para interpretar JSON no corpo das requisições
app.use(express.static('public')); // Servir arquivos estáticos da pasta 'public'

// Rota raiz para servir o arquivo HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rota de consulta
app.post('/consulta', async (req, res) => {
    let { usuario, chave, dataConsulta } = req.body; // Extraindo os valores de usuario e chave do corpo da requisição
    let {dataini, datafin} = "";
    // Calculando as datas
    if(dataConsulta){
        dataini = dataConsulta+'T03:00:00Z';
        // Cria uma nova data com base em dataConsulta
        var dataObj = new Date(dataConsulta + 'T00:00:00Z'); // Adiciona o horário para criar um objeto de data válido
        
        // Adiciona um dia
        dataObj.setUTCDate(dataObj.getUTCDate() + 1); 

        // Define datafin com a nova data e o horário fixo de 02:59:00Z
        var datafinDate = dataObj.toISOString().split('T')[0]; // Formata a data para YYYY-MM-DD
        datafin = datafinDate + 'T02:59:00Z';
    }else{
        const currentDate = new Date();
        const previousDate = new Date(currentDate);
        previousDate.setDate(currentDate.getDate() - 2); // Subtrai um dia para obter o dia anterior
        previousDate.setUTCHours(3, 0, 0, 0); // Define o horário para 03:00:00 UTC
    
        // Criando a data de fim (datafin) com horário fixo de 02:59:00Z
        datafin = new Date(currentDate);
        datafin.setDate(currentDate.getDate() - 1);
        datafin.setUTCHours(2, 59, 0, 0); // Define o horário para 02:59:00 UTC

        dataini = previousDate.toISOString().split('.')[0] + 'Z';
        var datafinISO = datafin.toISOString().split('.')[0] + 'Z'; // Corrigi para datafin
    }
    console.log('dataini:', dataini); // Esperado: dia anterior às 03:00:00Z
    console.log('datafin:', datafin); 
    console.log('datafinISO:', datafinISO); // Esperado: dia atual às 02:59:00Z
    console.log('dataConsulta:', dataConsulta); 
    console.log('dataObj:', dataObj); 

    const url = 'https://sideccr.daeebmt.sp.gov.br/sts_csv.jsp';
    const params = {
        usuario,
        chave,
        dataini,
        datafin: datafinISO || datafin// Certificando-se de que está usando a variável correta
    };

    try {
        const response = await axios.get(url, {
            params,
            responseType: 'arraybuffer',
            reponseEncoding: 'binary'
        });

        const data = iconv.decode(response.data, 'ISO-8859-1');

        // Converte a string CSV para um array de objetos JSON
        const lines = data.trim().split('\n');
        const jsonResult = lines.map(line => {
            const [usuario, id, start, end, value] = line.split(',').map(item => item.trim());
            return { usuario, id, start, end, value };
        });

        res.json(jsonResult);

    } catch (error) {
        res.status(500).send('Erro ao consultar o endpoint.');
        console.error(error);
    }
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Algo deu errado!');
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
