class Application < Sinatra::Base

    before do
        headers 'Access-Control-Allow-Origin' => '*',
                'Access-Control-Allow-Methods' => ['OPTIONS', 'GET', 'POST']
    end

    get '/?' do
        slim :index
    end

    get '/api/get/repos/:input' do
        result = HTTParty.get("https://api.github.com/users/#{params['input']}/repos").body
        return result.to_json
    end
end