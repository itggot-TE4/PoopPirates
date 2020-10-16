class Application < Sinatra::Base

    before do
        headers 'Access-Control-Allow-Origin' => '*',
                'Access-Control-Allow-Methods' => ['OPTIONS', 'GET', 'POST']
    end

    get '/?' do
        slim :index
    end

    get '/api/send/request/?' do
        headers = {
            'Authorization' => 'token  0f6c7734ee844ed44cfcc571d34e81f651c7a61f'
        }
        result = HTTParty.get(params['url'], :headers => headers)
        p result
        return result.to_json
    end
end