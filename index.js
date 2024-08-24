const express = require('express');
const axios = require('axios');
const iconv = require('iconv-lite');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000; // Usar porta de ambiente ou 3000 como padrão

// Configuração de CORS para permitir apenas domínios específicos em produção
const corsOptions = {
    origin: process.env.CORS_ORIGIN || '*', // Substitua '*' pelo seu domínio em produção
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions)); // Habilita CORS com opções

app.use(express.json()); // Middleware para interpretar JSON no corpo das requisições
app.use(express.static('public')); // Servir arquivos estáticos da pasta 'public'

// Rota de consulta
app.get('/consulta', async (req, res) => {
    const { usuario, chave } = req.body; // Extraindo os valores de usuario e chave do corpo da requisição

    // Calculando as datas
    const currentDate = new Date();
    const previousDate = new Date(currentDate);
    previousDate.setDate(currentDate.getDate() - 1);

    const dataini = previousDate.toISOString().split('.')[0] + 'Z';
    const datafin = currentDate.toISOString().split('.')[0] + 'Z';

    const url = 'https://sideccr.daeebmt.sp.gov.br/sts_csv.jsp';
    const params = {
        usuario,
        chave,
        dataini,
        datafin
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

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
