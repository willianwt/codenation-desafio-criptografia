/* eslint-disable no-plusplus */
import axios from 'axios';
import fs from 'fs';
import sha1 from 'js-sha1';

const readline = require('readline');
const FormData = require('form-data');

export default async () => {
  function askQuestion(query) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) => rl.question(query, (ans) => {
      rl.close();
      resolve(ans);
    }));
  }


  try {
    // informe o token

    const token = await askQuestion('Informe o Token:');

    // substitua pelo seu token
    const answer = await axios.get(`https://api.codenation.dev/v1/challenge/dev-ps/generate-data?token=${token}`);
    const json = await fs.writeFileSync('answer.json', JSON.stringify(answer.data), (err, result) => {
      if (err) console.log('error', err);
    });

    const answerJson = JSON.parse(fs.readFileSync('./answer.json', (err, jsonString) => {
      if (err) {
        console.log('Error reading file:', err);
      }
    }));
    // numero de casas no json
    const numeroCasas = answerJson.numero_casas;

    console.log(answerJson.cifrado);

    console.log(answerJson.token.length);

    // transforma o cifrado em array
    const array = Array.from(answerJson.cifrado);
    console.log(array);

    // transforma o array do cifrado em ASII
    const arrayAscii = array.map((char) => char.charCodeAt());
    console.log(arrayAscii);

    // diminui o numero de casas do  arrayAscii caso seja letra minúscula
    const arrayAsciiConvertido = arrayAscii.map((char) => {
      if (char >= 97 && char <= 122) {
        if ((char - numeroCasas) < 97) return char - numeroCasas + 26;
        if ((char - numeroCasas) > 122) return char - numeroCasas - 26;
        return char - numeroCasas;
      }

      return char;
    });
    console.log(arrayAsciiConvertido);

    // converte devolta para letras
    const arrayConvertido = arrayAsciiConvertido.map((char) => String.fromCharCode(parseInt(char, 10)));
    console.log(arrayConvertido);

    // converte o array em string
    const stringConvertido = arrayConvertido.join('');
    console.log(stringConvertido);

    // gera o sha1
    const hash = sha1(stringConvertido);
    console.log(hash);

    // prepara o obj para atualizar o answer.json
    const obj = {
      numero_casas: numeroCasas,
      cifrado: answerJson.cifrado,
      token: answerJson.token,
      decifrado: stringConvertido,
      resumo_criptografico: hash,
    };

    // atualiza o answer.json
    await fs.writeFile('answer.json', JSON.stringify(obj), (err, result) => {
      if (err) console.log('error', err);
    });

    // envia a resposta
    const form = new FormData();
    const stream = fs.createReadStream('./answer.json');
    form.append('answer', stream);
    const formHeaders = form.getHeaders();

    const envio = await axios.post(`https://api.codenation.dev/v1/challenge/dev-ps/submit-solution?token=${answerJson.token}`,
      form,
      {
        headers: {
          ...formHeaders,
        },
      },
      (err, result) => {
        if (err) console.log('error', err);
      });

    console.log(envio.data);
  } catch (error) {
    console.log(error);
  }
};
